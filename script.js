const state = {
  manualTest: "mean",
  csvTest: "mean",
  csvRows: [],
  csvHeaders: []
};

const $ = (id) => document.getElementById(id);

function normalPdf(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const absoluteX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absoluteX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absoluteX * absoluteX);
  return sign * y;
}

function normalCdf(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function inverseNormal(p) {
  if (p <= 0 || p >= 1) {
    return NaN;
  }

  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

function pValueFromZ(z, direction) {
  if (direction === "left") {
    return normalCdf(z);
  }
  if (direction === "right") {
    return 1 - normalCdf(z);
  }
  return 2 * Math.min(normalCdf(z), 1 - normalCdf(z));
}

function criticalValues(alpha, direction) {
  if (direction === "left") {
    return [inverseNormal(alpha)];
  }
  if (direction === "right") {
    return [inverseNormal(1 - alpha)];
  }
  return [inverseNormal(alpha / 2), inverseNormal(1 - alpha / 2)];
}

function formatNumber(value, digits = 3) {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return value.toFixed(digits);
}

function syncRangeAndNumber(rangeId, numberId, callback) {
  const range = $(rangeId);
  const number = $(numberId);

  function updateFromRange() {
    number.value = range.value;
    callback();
  }

  function updateFromNumber() {
    const min = Number(number.min);
    const max = Number(number.max);
    const value = Math.min(max, Math.max(min, Number(number.value)));
    number.value = value;
    range.value = value;
    callback();
  }

  range.addEventListener("input", updateFromRange);
  number.addEventListener("input", updateFromNumber);
}

function drawNormalCurve(canvas, z, direction, alpha, pValue) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = { left: 50, right: 28, top: 28, bottom: 48 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  const minX = -4;
  const maxX = 4;
  const maxY = normalPdf(0);

  const xToPixel = (x) => padding.left + ((x - minX) / (maxX - minX)) * graphWidth;
  const yToPixel = (y) => padding.top + graphHeight - (y / maxY) * graphHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d9e2f0";
  ctx.lineWidth = 1;
  for (let tick = -4; tick <= 4; tick += 1) {
    const x = xToPixel(tick);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + graphHeight);
    ctx.stroke();
  }

  ctx.strokeStyle = "#172033";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + graphHeight);
  ctx.lineTo(width - padding.right, padding.top + graphHeight);
  ctx.stroke();

  function shadeArea(from, to, color) {
    const start = Math.max(minX, from);
    const end = Math.min(maxX, to);
    if (start >= end) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(xToPixel(start), padding.top + graphHeight);
    for (let x = start; x <= end; x += 0.02) {
      ctx.lineTo(xToPixel(x), yToPixel(normalPdf(x)));
    }
    ctx.lineTo(xToPixel(end), padding.top + graphHeight);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  const critical = criticalValues(alpha, direction);
  if (direction === "left") {
    shadeArea(minX, critical[0], "rgba(200, 52, 77, 0.22)");
    shadeArea(minX, z, "rgba(36, 88, 211, 0.28)");
  } else if (direction === "right") {
    shadeArea(critical[0], maxX, "rgba(200, 52, 77, 0.22)");
    shadeArea(z, maxX, "rgba(36, 88, 211, 0.28)");
  } else {
    shadeArea(minX, critical[0], "rgba(200, 52, 77, 0.22)");
    shadeArea(critical[1], maxX, "rgba(200, 52, 77, 0.22)");
    shadeArea(minX, -Math.abs(z), "rgba(36, 88, 211, 0.28)");
    shadeArea(Math.abs(z), maxX, "rgba(36, 88, 211, 0.28)");
  }

  ctx.strokeStyle = "#2458d3";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = minX; x <= maxX; x += 0.02) {
    const px = xToPixel(x);
    const py = yToPixel(normalPdf(x));
    if (x === minX) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  ctx.setLineDash([7, 7]);
  critical.forEach((criticalValue) => {
    const x = xToPixel(criticalValue);
    ctx.strokeStyle = "#c8344d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + graphHeight);
    ctx.stroke();
  });

  ctx.setLineDash([]);
  if (Number.isFinite(z)) {
    const clampedZ = Math.max(minX, Math.min(maxX, z));
    const x = xToPixel(clampedZ);
    ctx.strokeStyle = "#0f9f8f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, padding.top + 12);
    ctx.lineTo(x, padding.top + graphHeight);
    ctx.stroke();

    ctx.fillStyle = "#0f766e";
    ctx.font = "700 18px Inter, Arial";
    ctx.fillText(`z = ${formatNumber(z, 2)}`, Math.min(width - 130, Math.max(58, x + 10)), padding.top + 24);
  }

  ctx.fillStyle = "#637087";
  ctx.font = "700 15px Inter, Arial";
  for (let tick = -4; tick <= 4; tick += 1) {
    ctx.fillText(String(tick), xToPixel(tick) - 5, height - 20);
  }

  ctx.fillStyle = "#172033";
  ctx.font = "700 16px Inter, Arial";
  ctx.fillText(`p-value area = ${formatNumber(pValue, 4)}`, padding.left, 28);
  ctx.fillStyle = "#c8344d";
  ctx.fillText("critical region", width - 180, 28);
}

function updateManual() {
  const direction = $("manualDirection").value;
  const alpha = Number($("manualAlpha").value);
  let z;
  let context;

  if (state.manualTest === "mean") {
    const benchmarkMean = Number($("benchmarkMeanNumber").value);
    const sampleMean = Number($("sampleMeanNumber").value);
    const standardDeviation = Number($("standardDeviationNumber").value);
    const sampleSize = Number($("sampleSizeMeanNumber").value);
    z = (sampleMean - benchmarkMean) / (standardDeviation / Math.sqrt(sampleSize));
    context = `The sample mean of ${formatNumber(sampleMean, 2)} is compared with the benchmark mean of ${formatNumber(benchmarkMean, 2)}.`;
  } else {
    const benchmarkProportion = Number($("benchmarkProportionNumber").value);
    const sampleProportion = Number($("sampleProportionNumber").value);
    const sampleSize = Number($("sampleSizeProportionNumber").value);
    const standardError = Math.sqrt((benchmarkProportion * (1 - benchmarkProportion)) / sampleSize);
    z = (sampleProportion - benchmarkProportion) / standardError;
    context = `The sample proportion of ${formatNumber(sampleProportion, 2)} is compared with the benchmark proportion of ${formatNumber(benchmarkProportion, 2)}.`;
  }

  const pValue = pValueFromZ(z, direction);
  const critical = criticalValues(alpha, direction);
  const reject = pValue < alpha;
  const directionLabel = $("manualDirection").selectedOptions[0].textContent.toLowerCase();

  $("manualZ").textContent = formatNumber(z, 3);
  $("manualP").textContent = formatNumber(pValue, 4);
  $("manualCritical").textContent = critical.map((value) => formatNumber(value, 3)).join(", ");
  $("manualDecision").textContent = reject ? "Reject H0" : "Fail to reject H0";
  $("manualDecision").style.color = reject ? "var(--danger)" : "var(--success)";
  $("manualConclusion").textContent = `${context} Because the ${directionLabel} p-value is ${formatNumber(pValue, 4)} and alpha is ${alpha}, we ${reject ? "reject" : "fail to reject"} the null hypothesis.`;

  drawNormalCurve($("manualCanvas"), z, direction, alpha, pValue);
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some((cell) => cell !== "")) {
    rows.push(row);
  }

  if (rows.length < 2) {
    return { headers: [], data: [] };
  }

  const headers = rows[0];
  const data = rows.slice(1).map((values) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] ?? "";
    });
    return entry;
  });

  return { headers, data };
}

function numericValues(rows, column) {
  return rows.map((row) => Number(row[column])).filter((value) => Number.isFinite(value));
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStandardDeviation(values) {
  if (values.length < 2) {
    return 0;
  }
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function setOptions(select, values) {
  select.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function populateCsvSelectors() {
  const headers = state.csvHeaders;
  setOptions($("benchmarkGroup"), headers);
  setOptions($("testGroup"), headers);
  if (headers.length > 1) {
    $("testGroup").selectedIndex = 1;
  }

  setOptions($("groupColumn"), headers);
  setOptions($("successColumn"), headers);

  const groupGuess = headers.find((header) => header.toLowerCase().includes("group")) || headers[0];
  const successGuess = headers.find((header) => header.toLowerCase().includes("success")) || headers[1] || headers[0];
  $("groupColumn").value = groupGuess;
  $("successColumn").value = successGuess;
  populateCategories();
}

function populateCategories() {
  const groupColumn = $("groupColumn").value;
  const categories = [...new Set(state.csvRows.map((row) => row[groupColumn]).filter(Boolean))];
  setOptions($("benchmarkCategory"), categories);
  setOptions($("testCategory"), categories);
  if (categories.length > 1) {
    $("testCategory").selectedIndex = 1;
  }
}

function updateCsv() {
  const direction = $("csvDirection").value;
  const alpha = Number($("csvAlpha").value);

  if (state.csvRows.length === 0) {
    drawNormalCurve($("csvCanvas"), 0, direction, alpha, 1);
    return;
  }

  let z;
  let pValue;
  let reject;
  let conclusion;
  let summaryHtml;

  if (state.csvTest === "mean") {
    const benchmarkColumn = $("benchmarkGroup").value;
    const testColumn = $("testGroup").value;
    const benchmarkValues = numericValues(state.csvRows, benchmarkColumn);
    const testValues = numericValues(state.csvRows, testColumn);

    if (benchmarkValues.length < 2 || testValues.length < 2) {
      $("csvStatus").textContent = "Both selected columns must contain at least two numeric values.";
      return;
    }

    const benchmarkMean = mean(benchmarkValues);
    const testMean = mean(testValues);
    const testSd = sampleStandardDeviation(testValues);
    z = (testMean - benchmarkMean) / (testSd / Math.sqrt(testValues.length));
    pValue = pValueFromZ(z, direction);
    reject = pValue < alpha;

    summaryHtml = `
      <div class="summary-row"><strong>Group</strong><strong>n</strong><strong>mean</strong><strong>std. dev.</strong></div>
      <div class="summary-row"><span>${benchmarkColumn}</span><span>${benchmarkValues.length}</span><span>${formatNumber(benchmarkMean, 2)}</span><span>${formatNumber(sampleStandardDeviation(benchmarkValues), 2)}</span></div>
      <div class="summary-row"><span>${testColumn}</span><span>${testValues.length}</span><span>${formatNumber(testMean, 2)}</span><span>${formatNumber(testSd, 2)}</span></div>
    `;
    conclusion = `The test group mean (${formatNumber(testMean, 2)}) was compared with the benchmark group mean (${formatNumber(benchmarkMean, 2)}). Since p = ${formatNumber(pValue, 4)} and alpha = ${alpha}, we ${reject ? "reject" : "fail to reject"} the null hypothesis.`;
  } else {
    const groupColumn = $("groupColumn").value;
    const successColumn = $("successColumn").value;
    const benchmarkCategory = $("benchmarkCategory").value;
    const testCategory = $("testCategory").value;
    const benchmarkRows = state.csvRows.filter((row) => row[groupColumn] === benchmarkCategory);
    const testRows = state.csvRows.filter((row) => row[groupColumn] === testCategory);
    const benchmarkSuccess = benchmarkRows.map((row) => Number(row[successColumn])).filter((value) => value === 0 || value === 1);
    const testSuccess = testRows.map((row) => Number(row[successColumn])).filter((value) => value === 0 || value === 1);

    if (benchmarkSuccess.length < 2 || testSuccess.length < 2) {
      $("csvStatus").textContent = "Both selected categories must contain at least two 0/1 success values.";
      return;
    }

    const benchmarkProportion = mean(benchmarkSuccess);
    const testProportion = mean(testSuccess);
    const standardError = Math.sqrt((benchmarkProportion * (1 - benchmarkProportion)) / testSuccess.length);
    z = (testProportion - benchmarkProportion) / standardError;
    pValue = pValueFromZ(z, direction);
    reject = pValue < alpha;

    summaryHtml = `
      <div class="summary-row"><strong>Group</strong><strong>n</strong><strong>mean</strong><strong>std. dev.</strong></div>
      <div class="summary-row"><span>${benchmarkCategory}</span><span>${benchmarkSuccess.length}</span><span>${formatNumber(benchmarkProportion, 2)}</span><span>${formatNumber(sampleStandardDeviation(benchmarkSuccess), 2)}</span></div>
      <div class="summary-row"><span>${testCategory}</span><span>${testSuccess.length}</span><span>${formatNumber(testProportion, 2)}</span><span>${formatNumber(sampleStandardDeviation(testSuccess), 2)}</span></div>
    `;
    conclusion = `The test group proportion (${formatNumber(testProportion, 2)}) was compared with the benchmark group proportion (${formatNumber(benchmarkProportion, 2)}). Since p = ${formatNumber(pValue, 4)} and alpha = ${alpha}, we ${reject ? "reject" : "fail to reject"} the null hypothesis.`;
  }

  $("csvSummary").innerHTML = summaryHtml;
  $("csvZ").textContent = formatNumber(z, 3);
  $("csvP").textContent = formatNumber(pValue, 4);
  $("csvDecision").textContent = reject ? "Reject H0" : "Fail to reject H0";
  $("csvDecision").style.color = reject ? "var(--danger)" : "var(--success)";
  $("csvConclusion").textContent = conclusion;
  $("csvStatus").textContent = `${state.csvRows.length} data rows loaded.`;
  drawNormalCurve($("csvCanvas"), z, direction, alpha, pValue);
}

function initializeTabs() {
  $("manualTab").addEventListener("click", () => {
    $("manualTab").classList.add("active");
    $("csvTab").classList.remove("active");
    $("manualMode").classList.add("active");
    $("csvMode").classList.remove("active");
    $("manualTab").setAttribute("aria-selected", "true");
    $("csvTab").setAttribute("aria-selected", "false");
    updateManual();
  });

  $("csvTab").addEventListener("click", () => {
    $("csvTab").classList.add("active");
    $("manualTab").classList.remove("active");
    $("csvMode").classList.add("active");
    $("manualMode").classList.remove("active");
    $("csvTab").setAttribute("aria-selected", "true");
    $("manualTab").setAttribute("aria-selected", "false");
    updateCsv();
  });
}

function initializeManual() {
  document.querySelectorAll("[data-manual-test]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-manual-test]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.manualTest = button.dataset.manualTest;
      $("meanControls").classList.toggle("hidden", state.manualTest !== "mean");
      $("proportionControls").classList.toggle("hidden", state.manualTest !== "proportion");
      updateManual();
    });
  });

  [
    ["benchmarkMeanRange", "benchmarkMeanNumber"],
    ["sampleMeanRange", "sampleMeanNumber"],
    ["standardDeviationRange", "standardDeviationNumber"],
    ["sampleSizeMeanRange", "sampleSizeMeanNumber"],
    ["benchmarkProportionRange", "benchmarkProportionNumber"],
    ["sampleProportionRange", "sampleProportionNumber"],
    ["sampleSizeProportionRange", "sampleSizeProportionNumber"]
  ].forEach(([range, number]) => syncRangeAndNumber(range, number, updateManual));

  $("manualDirection").addEventListener("change", updateManual);
  $("manualAlpha").addEventListener("change", updateManual);
}

function initializeCsv() {
  document.querySelectorAll("[data-csv-test]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-csv-test]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.csvTest = button.dataset.csvTest;
      $("csvColumnSelectors").classList.toggle("hidden", state.csvTest !== "mean");
      $("proportionColumnSelectors").classList.toggle("hidden", state.csvTest !== "proportion");
      updateCsv();
    });
  });

  $("csvFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(reader.result);
      state.csvHeaders = parsed.headers;
      state.csvRows = parsed.data;
      if (state.csvHeaders.length === 0) {
        $("csvStatus").textContent = "The CSV file could not be read. Check that it has headers and rows.";
        return;
      }
      populateCsvSelectors();
      updateCsv();
    };
    reader.readAsText(file);
  });

  ["csvDirection", "csvAlpha", "benchmarkGroup", "testGroup", "successColumn", "benchmarkCategory", "testCategory"].forEach((id) => {
    $(id).addEventListener("change", updateCsv);
  });

  $("groupColumn").addEventListener("change", () => {
    populateCategories();
    updateCsv();
  });
}

initializeTabs();
initializeManual();
initializeCsv();
updateManual();
drawNormalCurve($("csvCanvas"), 0, "right", 0.05, 1);
