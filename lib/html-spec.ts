/**
 * 산출물 HTML 디자인 규격.
 *
 * 수업 교안(01_홍요셉_이력서_자소서_포트폴리오_v4.html)의 디자인 시스템을 그대로 옮긴 것입니다.
 * 프롬프트에 이 규격을 통째로 넣어야, Claude가 "수정 의견"이 아니라
 * **바로 브라우저에서 열리는 완성된 HTML 파일**을 만들어 줍니다.
 *
 * 교안과 동일한 클래스명을 쓰므로, 교육생이 수업 결과물과 나란히 놓고 비교할 수 있습니다.
 */

/** 모든 산출물 HTML이 공유하는 <head> ~ <style> 블록 */
export const DOC_CSS = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[문서 제목을 여기에]</title>
<link rel="stylesheet" as="style" crossorigin
 href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css" />
<style>
  :root{
    --ink:#111111; --canvas:#ffffff; --cloud:#f5f5f5; --charcoal:#39393b;
    --mute:#707072; --stone:#9e9ea0; --hairline:#cacacb; --hairline-soft:#e5e5e5;
    --accent:#0b7285;
  }
  *{ box-sizing:border-box; }
  html,body{
    margin:0; padding:0; background:var(--cloud);
    font-family:'Pretendard Variable',Pretendard,-apple-system,'Malgun Gothic',sans-serif;
    color:var(--ink); word-break:keep-all; overflow-wrap:break-word;
  }
  .page{ width:210mm; min-height:297mm; margin:0 auto 24px; padding:18mm 16mm 16mm; background:var(--canvas); }
  .doc-eyebrow{ font-size:11px; font-weight:700; letter-spacing:1.2px; color:var(--mute); text-transform:uppercase; }
  .doc-title{ font-size:40px; font-weight:800; line-height:1.1; margin:6px 0 0; letter-spacing:-0.5px; }
  .doc-headline{ font-size:15px; font-weight:400; line-height:1.6; color:var(--charcoal); margin:12px 0 0; }
  .rule{ border:0; border-top:1px solid var(--ink); margin:16px 0 22px; height:0; }
  .rule-soft{ border:0; border-top:1px solid var(--hairline-soft); margin:16px 0; height:0; }
  .sec{ margin-bottom:22px; }
  .sec-h{ font-size:16px; font-weight:800; margin:0 0 10px; padding-bottom:7px; border-bottom:1px solid var(--hairline); }
  .sec-h .n{ color:var(--mute); margin-right:8px; font-weight:700; }
  ul.list{ margin:0; padding-left:0; list-style:none; }
  ul.list li{ font-size:13.5px; line-height:1.7; padding:5px 0 5px 13px; position:relative; color:var(--charcoal); }
  ul.list li::before{ content:''; position:absolute; left:0; top:12px; width:4px; height:4px; background:var(--ink); border-radius:50%; }
  ul.list li b{ color:var(--ink); font-weight:700; }
  .kv{ display:flex; flex-wrap:wrap; }
  .kv > div{ width:50%; font-size:13.5px; line-height:2.0; color:var(--charcoal); }
  .kv b{ display:inline-block; width:70px; color:var(--ink); font-weight:700; }
  .three{ display:flex; gap:10px; }
  .three > div{ flex:1; background:var(--cloud); padding:14px 16px; }
  .three .lab{ font-size:11px; font-weight:700; color:var(--mute); letter-spacing:0.5px; }
  .three .val{ font-size:13.5px; font-weight:700; line-height:1.55; margin-top:6px; }
  .intro{ font-size:13.5px; line-height:1.85; color:var(--charcoal); margin:0; }
  .job{ padding:9px 0; border-bottom:1px solid var(--hairline-soft); }
  .job:last-child{ border-bottom:0; }
  .job-top{ display:flex; justify-content:space-between; align-items:baseline; gap:12px; }
  .job-name{ font-size:13.5px; font-weight:700; }
  .job-date{ font-size:12px; color:var(--mute); white-space:nowrap; }
  .job-desc{ font-size:13px; line-height:1.65; color:var(--charcoal); margin-top:4px; }
  .chips{ display:flex; flex-wrap:wrap; gap:7px; }
  .chip{ font-size:12px; font-weight:700; padding:7px 15px; border:1px solid var(--hairline); border-radius:9999px; color:var(--ink); }
  .chip.solid{ background:var(--ink); color:#fff; border-color:var(--ink); }
  .chip.accent{ background:var(--accent); color:#fff; border-color:var(--accent); }
  .qa{ margin-bottom:20px; }
  .qa-q{ font-size:12px; font-weight:700; color:var(--mute); letter-spacing:0.5px; margin-bottom:6px; }
  .qa-h{ font-size:19px; font-weight:800; margin:0 0 9px; letter-spacing:-0.3px; }
  .qa-body{ font-size:13.5px; line-height:1.85; color:var(--charcoal); margin:0; text-align:justify; }
  .qa-count{ font-size:11px; color:var(--stone); text-align:right; margin-top:5px; }
  .stat-row{ display:flex; gap:10px; margin-bottom:20px; }
  .stat{ flex:1; background:var(--ink); color:#fff; padding:18px 16px; }
  .stat .num{ font-size:34px; font-weight:800; line-height:1; letter-spacing:-1px; }
  .stat .lab{ font-size:11.5px; line-height:1.5; color:var(--stone); margin-top:8px; }
  .two-col{ display:flex; gap:10px; }
  .two-col > div{ flex:1; padding:16px; }
  .col-light{ background:var(--cloud); }
  .col-dark{ background:var(--ink); }
  .col-dark .sec-sub, .col-dark ul.list li{ color:#fff; }
  .col-dark ul.list li::before{ background:#fff; }
  .sec-sub{ font-size:12px; font-weight:700; letter-spacing:0.5px; margin:0 0 8px; }
  .col-light .sec-sub{ color:var(--mute); }
  .col-dark .sec-sub{ color:var(--stone); }
  /* 표 */
  table.tbl{ width:100%; border-collapse:collapse; font-size:12.5px; }
  table.tbl th{ text-align:left; font-size:11px; font-weight:700; color:var(--mute); letter-spacing:0.4px;
    padding:8px 10px; border-bottom:1px solid var(--hairline); text-transform:uppercase; }
  table.tbl td{ padding:9px 10px; border-bottom:1px solid var(--hairline-soft); color:var(--charcoal); line-height:1.6; vertical-align:top; }
  table.tbl td b{ color:var(--ink); }
  .tag{ display:inline-block; font-size:11px; font-weight:700; padding:2px 8px; border-radius:9999px; white-space:nowrap; }
  .tag.ok{ background:#e6f4ea; color:#137333; }
  .tag.mid{ background:#fef7e0; color:#b06000; }
  .tag.gap{ background:#fce8e6; color:#c5221f; }
  /* 면접 카드 */
  .card{ background:var(--cloud); padding:14px 16px; margin-bottom:10px; }
  .card-q{ font-size:14px; font-weight:800; margin:0 0 6px; }
  .card-meta{ font-size:11.5px; color:var(--mute); margin:0 0 8px; }
  .card-a{ font-size:13px; line-height:1.75; color:var(--charcoal); margin:0; }
  .star{ display:flex; gap:8px; padding:6px 0; border-bottom:1px solid var(--hairline-soft); }
  .star:last-child{ border-bottom:0; }
  .star-k{ width:52px; flex-shrink:0; font-size:11px; font-weight:800; color:var(--mute); letter-spacing:0.5px; }
  .star-v{ font-size:13px; line-height:1.7; color:var(--charcoal); }
  .script{ background:var(--cloud); padding:18px 20px; font-size:14.5px; line-height:2.0; color:var(--ink); }
  .script b{ background:linear-gradient(transparent 60%, #ffe58f 60%); font-weight:700; }
  .warn{ border-left:3px solid var(--accent); padding:10px 14px; background:var(--cloud); font-size:12.5px; line-height:1.7; color:var(--charcoal); }
  .foot{ margin-top:24px; padding-top:14px; border-top:1px solid var(--hairline);
    font-size:10.5px; color:var(--stone); display:flex; justify-content:space-between; }
  @media (max-width:820px){
    .page{ width:100%; min-height:auto; padding:24px 18px; margin-bottom:12px; }
    .doc-title{ font-size:30px; }
    .kv > div{ width:100%; }
    .three, .two-col, .stat-row{ flex-direction:column; }
    .job-top{ flex-direction:column; gap:2px; }
  }
  @media print{ body{ background:#fff; } .page{ margin:0; page-break-after:always; } }
</style>
</head>
<body>`;

/** 모든 산출물 HTML의 공통 출력 규칙 */
export const HTML_OUTPUT_RULES = `# 출력 형식 — 매우 중요

**수정 의견이나 조언만 주지 마세요. 바로 브라우저에서 열리는 완성된 HTML 파일 하나를 만들어 주세요.**

1. 아래 CSS 규격을 **그대로** 사용하세요. 클래스명을 바꾸거나 새로 만들지 마세요.
2. \`<!DOCTYPE html>\`부터 \`</html>\`까지 **하나의 완전한 코드 블록**으로 출력하세요.
3. 저를 위한 설명은 HTML 코드 블록이 **끝난 뒤에** 짧게 덧붙이세요.
4. \`<title>\`과 본문의 이름·직무를 실제 값으로 채우세요.
5. A4 인쇄를 전제로 합니다. 한 \`.page\`가 A4 한 장이며, 내용이 넘치면 \`.page\`를 추가하세요.

## 사용할 CSS 규격 (이 블록을 그대로 문서 앞부분에 넣으세요)

\`\`\`html
${DOC_CSS}
\`\`\`

닫을 때는 \`</body>\\n</html>\`로 끝내세요.`;

/** 저장·활용 안내 (프롬프트 카드의 nextStep 문구에서 재사용) */
export const SAVE_GUIDE =
  "코드 블록 오른쪽 위 복사 버튼을 눌러 전체를 복사 → 메모장에 붙여넣기 → " +
  "'파일 > 다른 이름으로 저장' → 파일명 끝에 .html 을 붙이고 인코딩을 UTF-8로 저장 → 더블클릭하면 열립니다.";
