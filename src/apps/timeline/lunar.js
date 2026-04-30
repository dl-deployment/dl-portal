const VI_MONTHS = [
  "Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6",
  "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12",
];

const VI_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function getToday() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function formatDateVi(date) {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  const wd = VI_DAYS[date.getDay()];
  return `${wd}, ${d}/${m}/${y}`;
}

export function getViMonth(index) {
  return VI_MONTHS[index];
}

export function calcDaysLeft(solarDateStr, type) {
  const today = getToday();
  const [year, month, day] = solarDateStr.split("-").map(Number);
  let eventDate = new Date(year, month - 1, day);

  if (eventDate < today) {
    eventDate = new Date(year + 1, month - 1, day);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.round((eventDate - today) / msPerDay);
  return { date: eventDate, daysLeft };
}

export function solarToLunar(solarDate) {
  const dd = solarDate.getDate();
  const mm = solarDate.getMonth() + 1;
  const yy = solarDate.getFullYear();

  function jdFromDate(d, m, y) {
    let a = Math.floor((14 - m) / 12);
    let _y = y + 4800 - a;
    let _m = m + 12 * a - 3;
    let jd =
      d +
      Math.floor((153 * _m + 2) / 5) +
      365 * _y +
      Math.floor(_y / 4) -
      Math.floor(_y / 100) +
      Math.floor(_y / 400) -
      32045;
    if (jd < 2299161) {
      jd =
        d +
        Math.floor((153 * _m + 2) / 5) +
        365 * _y +
        Math.floor(_y / 4) -
        32083;
    }
    return jd;
  }

  function getNewMoonDay(k, timeZone) {
    const T = k / 1236.85;
    const T2 = T * T;
    const T3 = T2 * T;
    const dr = Math.PI / 180;
    let Jd1 =
      2415020.75933 +
      29.53058868 * k +
      0.0001178 * T2 -
      0.000000155 * T3 +
      0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 =
      (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
      0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 =
      C1 -
      0.0074 * Math.sin(dr * (M - Mpr)) +
      0.0004 * Math.sin(dr * (2 * F + M));
    C1 =
      C1 -
      0.0004 * Math.sin(dr * (2 * F - M)) -
      0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 =
      C1 +
      0.001 * Math.sin(dr * (2 * F - Mpr)) +
      0.0005 * Math.sin(dr * (2 * Mpr + M));
    let deltat;
    if (T < -11) {
      deltat =
        0.001 +
        0.000839 * T +
        0.0002261 * T2 -
        0.00000845 * T3 -
        0.000000081 * T * T3;
    } else {
      deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
    }
    return Math.floor(Jd1 + C1 - deltat + 0.5 + timeZone / 24);
  }

  function getSunLongitude(jdn, timeZone) {
    const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
    const T2 = T * T;
    const dr = Math.PI / 180;
    const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M);
    DL = DL + 0.00029 * Math.sin(dr * 3 * M);
    let theta = L0 + DL;
    theta = theta - 360 * Math.floor(theta / 360);
    return Math.floor(theta / 30);
  }

  function getLeapMonthOffset(a11, timeZone) {
    const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0,
      i = 1,
      arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i++;
      arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  const timeZone = 7;
  const jd = jdFromDate(dd, mm, yy);
  const k = Math.floor((jd - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > jd) monthStart = getNewMoonDay(k, timeZone);

  let a11 = getNewMoonDay(
    Math.floor((jd - 2415021.076998695) / 29.530588853 - 6),
    timeZone,
  );
  let b11 = a11;
  let lunarYear;
  if (b11 >= monthStart) {
    lunarYear = yy;
    a11 = getNewMoonDay(
      Math.floor((jd - 2415021.076998695) / 29.530588853 - 17),
      timeZone,
    );
  } else {
    lunarYear = yy + 1;
    b11 = getNewMoonDay(
      Math.floor((jd - 2415021.076998695) / 29.530588853 + 11),
      timeZone,
    );
  }

  const lunarDay = jd - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let leapMonth = 0,
    leapMonthDiff = getLeapMonthOffset(a11, timeZone);
  if (b11 - a11 > 365)
    leapMonth = leapMonthDiff + (getSunLongitude(a11, timeZone) === 11 ? 1 : 0);
  const lunarMonth =
    diff +
    (leapMonth !== 0 && diff >= leapMonth ? -1 : 0) +
    (getSunLongitude(a11, timeZone) === 11 ? 1 : 11);

  return {
    day: lunarDay,
    month: ((lunarMonth - 1) % 12) + 1,
    year: lunarYear,
  };
}
