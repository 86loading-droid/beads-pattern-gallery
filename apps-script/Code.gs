/**
 * 컬러비즈 재고 API — 구글 스프레드시트 + Apps Script
 *
 * 이 파일 하나를 Apps Script 편집기에 붙여넣고 웹 앱으로 배포하면,
 * 모든 태블릿이 같은 재고와 같은 도안을 보게 됩니다.
 * 아래 SHEET_ID 가 가리키는 스프레드시트에 시트 세 장을 자동으로 만듭니다.
 *   재고    — 색상키 | 색상명 | 수량      (교사가 시트에서 직접 고쳐도 앱에 반영됩니다)
 *   소비기록 — 기록ID | 시각 | 구분 | 도안 | 수량 | 색상별사용
 *   도안    — 도안ID | 이름 | 주제 | 가로 | 세로 | 칸 | 만든시각   (앱에서 직접 만든 도안)
 */

/** 이 스크립트가 쓰는 스프레드시트 — 독립 프로젝트로 배포해도 같은 시트를 봅니다 */
var SHEET_ID = '1zeJ0G8Rg1w8wtcCV_xHG14NNp0dcaEeKvQpiuGAPb1I';

function book_() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

var SHEET_STOCK = '재고';
var SHEET_LOG = '소비기록';
var SHEET_PATTERN = '도안';
var LOG_KEEP = 300; // 소비기록 보관 건수 — 넘으면 오래된 것부터 지웁니다

/** 보유 색상과 최초 수량 — 색을 추가하려면 여기에 한 줄 넣으면 됩니다 */
var COLORS = [
  ['A', '연두', 16604],
  ['G', '초록', 9556],
  ['K', '검정', 17059],
  ['R', '빨강', 8019],
  ['O', '주황', 9704],
  ['Y', '노랑', 21031],
  ['N', '연한 갈색', 9630],
  ['S', '살색', 15717],
  ['W', '화이트', 7585],
  ['V', '연보라', 3864],
  ['P', '찐핑', 10231],
  ['T', '투명', 9000]
];

/* ------------------------------------------------------------------ */
/* 요청 처리                                                            */
/* ------------------------------------------------------------------ */

function doGet(e) {
  // 브라우저 주소창에 웹 앱 주소를 그대로 넣어 상태를 확인할 때 씁니다.
  var key = e && e.parameter ? e.parameter.key : '';
  if (!checkKey_(key)) return json_({ ok: false, error: 'bad_key' });
  return json_({ ok: true, state: readState_() });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad_json' });
  }
  if (!checkKey_(body.key)) return json_({ ok: false, error: 'bad_key' });

  var lock = LockService.getScriptLock();
  try {
    // 태블릿 여러 대가 같은 순간에 눌러도 수량이 어긋나지 않도록 순서대로 처리합니다.
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }

  try {
    switch (body.action) {
      case 'state':
        return json_({ ok: true, state: readState_() });
      case 'consume':
        return json_(consume_(body));
      case 'removeEntry':
        return json_(removeEntry_(body.id));
      case 'adjust':
        return json_(adjust_(body.next));
      case 'patterns':
        return json_({ ok: true, list: readPatterns_() });
      case 'savePattern':
        return json_(savePattern_(body.pattern));
      case 'removePattern':
        return json_(removePattern_(body.id));
      default:
        return json_({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ */
/* 동작                                                                 */
/* ------------------------------------------------------------------ */

/** 사용한 만큼 재고를 줄이고 소비 기록을 남긴다 */
function consume_(body) {
  var used = body.used || {};
  var stock = readStock_();
  var short = [];
  var totalUsed = 0;

  for (var k in used) {
    var v = Math.floor(Number(used[k]) || 0);
    if (v <= 0) continue;
    if ((stock[k] || 0) < v) short.push(k);
    totalUsed += v;
  }
  if (totalUsed === 0) return { ok: false, error: 'empty' };
  if (short.length) return { ok: false, error: 'short', shortages: short };

  for (var key in used) {
    var n = Math.floor(Number(used[key]) || 0);
    if (n > 0) stock[key] = (stock[key] || 0) - n;
  }
  writeStock_(stock);

  appendLog_({
    id: Utilities.getUuid(),
    at: nowText_(),
    kind: body.kind === '부분 사용' ? '부분 사용' : '완성',
    title: String(body.title || ''),
    total: totalUsed,
    used: used
  });
  return { ok: true, state: readState_() };
}

/** 소비 기록 한 건을 지우고 그만큼 재고를 되돌린다 */
function removeEntry_(id) {
  var sheet = logSheet_();
  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][0]) !== String(id)) continue;
    var used = {};
    try {
      used = JSON.parse(values[r][5] || '{}');
    } catch (err) {
      used = {};
    }
    var stock = readStock_();
    for (var k in used) stock[k] = (stock[k] || 0) + (Math.floor(Number(used[k])) || 0);
    writeStock_(stock);
    sheet.deleteRow(r + 1);
    return { ok: true, state: readState_() };
  }
  return { ok: false, error: 'not_found' };
}

/** 재고 수량을 직접 고친다 — 소비 기록에는 남기지 않는다 */
function adjust_(next) {
  var stock = readStock_();
  var changed = false;
  for (var i = 0; i < COLORS.length; i++) {
    var k = COLORS[i][0];
    if (next[k] === undefined || next[k] === null) continue;
    var v = Math.max(0, Math.floor(Number(next[k]) || 0));
    if (v !== stock[k]) {
      stock[k] = v;
      changed = true;
    }
  }
  if (!changed) return { ok: false, error: 'nochange' };
  writeStock_(stock);
  return { ok: true, state: readState_() };
}

/* ------------------------------------------------------------------ */
/* 앱에서 직접 만든 도안                                                 */
/* ------------------------------------------------------------------ */

/** 한 변의 최대 칸 수 — 앱의 편집기와 같은 기준 */
var PATTERN_MAX = 17;
var PATTERN_MIN = 4;

function patternSheet_() {
  var ss = book_();
  var sheet = ss.getSheetByName(SHEET_PATTERN);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PATTERN);
    sheet.getRange(1, 1, 1, 7).setValues([['도안ID', '이름', '주제', '가로', '세로', '칸', '만든시각']]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readPatterns_() {
  var values = patternSheet_().getDataRange().getValues();
  var list = [];
  // 최근에 만든 것이 먼저 오도록 아래에서부터 읽는다
  for (var r = values.length - 1; r >= 1; r--) {
    var id = String(values[r][0] || '').trim();
    if (!id) continue;
    var rows = [];
    try {
      rows = JSON.parse(values[r][5] || '[]');
    } catch (err) {
      rows = [];
    }
    if (!rows.length) continue;
    list.push({
      id: id,
      title: String(values[r][1] || ''),
      category: String(values[r][2] || 'shape'),
      rows: rows,
      custom: true,
      at: String(values[r][6] || '')
    });
  }
  return list;
}

/** 새 도안을 넣거나, 같은 ID가 있으면 그 줄을 고쳐 쓴다 */
function savePattern_(p) {
  if (!p) return { ok: false, error: 'empty' };
  var title = String(p.title || '').trim();
  if (!title) return { ok: false, error: 'notitle' };

  var rows = p.rows;
  if (!rows || !rows.length || rows.length < PATTERN_MIN) return { ok: false, error: 'empty' };
  var width = String(rows[0]).length;
  if (width < PATTERN_MIN) return { ok: false, error: 'empty' };
  if (width > PATTERN_MAX || rows.length > PATTERN_MAX) return { ok: false, error: 'toobig' };

  var painted = false;
  for (var i = 0; i < rows.length; i++) {
    var line = String(rows[i]);
    if (line.length !== width) return { ok: false, error: 'empty' };
    if (line.replace(/\./g, '').length > 0) painted = true;
  }
  if (!painted) return { ok: false, error: 'empty' };

  var sheet = patternSheet_();
  var id = String(p.id || Utilities.getUuid());
  var line = [id, title, String(p.category || 'shape'), width, rows.length, JSON.stringify(rows), String(p.at || nowText_())];

  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][0]) === id) {
      sheet.getRange(r + 1, 1, 1, 7).setValues([line]);
      return { ok: true, list: readPatterns_() };
    }
  }
  sheet.appendRow(line);
  return { ok: true, list: readPatterns_() };
}

function removePattern_(id) {
  var sheet = patternSheet_();
  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][0]) !== String(id)) continue;
    sheet.deleteRow(r + 1);
    return { ok: true, list: readPatterns_() };
  }
  return { ok: false, error: 'notfound' };
}

/* ------------------------------------------------------------------ */
/* 시트 입출력                                                          */
/* ------------------------------------------------------------------ */

function readState_() {
  return { stock: readStock_(), logs: readLogs_() };
}

function stockSheet_() {
  var ss = book_();
  var sheet = ss.getSheetByName(SHEET_STOCK);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_STOCK);
    var rows = [['색상키', '색상명', '수량']];
    for (var i = 0; i < COLORS.length; i++) rows.push([COLORS[i][0], COLORS[i][1], COLORS[i][2]]);
    sheet.getRange(1, 1, rows.length, 3).setValues(rows);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readStock_() {
  var values = stockSheet_().getDataRange().getValues();
  var stock = {};
  for (var i = 0; i < COLORS.length; i++) stock[COLORS[i][0]] = COLORS[i][2];
  for (var r = 1; r < values.length; r++) {
    var key = String(values[r][0] || '').trim();
    if (!key) continue;
    stock[key] = Math.max(0, Math.floor(Number(values[r][2]) || 0));
  }
  return stock;
}

function writeStock_(stock) {
  var sheet = stockSheet_();
  var rows = [];
  for (var i = 0; i < COLORS.length; i++) {
    var k = COLORS[i][0];
    rows.push([k, COLORS[i][1], Math.max(0, Math.floor(stock[k] || 0))]);
  }
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
}

function logSheet_() {
  var ss = book_();
  var sheet = ss.getSheetByName(SHEET_LOG);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LOG);
    sheet.getRange(1, 1, 1, 6).setValues([['기록ID', '시각', '구분', '도안', '수량', '색상별사용']]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readLogs_() {
  var values = logSheet_().getDataRange().getValues();
  var logs = [];
  for (var r = values.length - 1; r >= 1; r--) {
    var used = {};
    try {
      used = JSON.parse(values[r][5] || '{}');
    } catch (err) {
      used = {};
    }
    logs.push({
      id: String(values[r][0]),
      at: String(values[r][1]),
      kind: String(values[r][2]),
      title: String(values[r][3]),
      total: Math.floor(Number(values[r][4]) || 0),
      used: used
    });
  }
  return logs;
}

function appendLog_(entry) {
  var sheet = logSheet_();
  sheet.appendRow([entry.id, entry.at, entry.kind, entry.title, entry.total, JSON.stringify(entry.used)]);
  var extra = sheet.getLastRow() - 1 - LOG_KEEP;
  if (extra > 0) sheet.deleteRows(2, extra);
}

/* ------------------------------------------------------------------ */
/* 공통                                                                 */
/* ------------------------------------------------------------------ */

/**
 * 접속 열쇠 확인.
 * 스크립트 속성(파일 > 프로젝트 설정 > 스크립트 속성)에 API_KEY 를 넣어 두세요.
 * 값을 넣지 않으면 열쇠 검사를 하지 않습니다.
 */
function checkKey_(key) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!expected) return true;
  return String(key || '') === expected;
}

function nowText_() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'MM. dd. HH:mm');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** 편집기에서 한 번 실행하면 시트 세 장이 만들어집니다 */
function 초기설정() {
  stockSheet_();
  logSheet_();
  patternSheet_();
  book_().toast('재고 · 소비기록 · 도안 시트를 준비했습니다.');
}
