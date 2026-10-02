// ตัวเลขสดสำหรับจอ Digital Signage (BrightSign) — หน้า /signage ไม่ต้องล็อกอิน จึงส่งเฉพาะ "ยอดรวมระดับอาคาร" ที่โชว์ประชาสัมพันธ์ได้
// (ไม่มี entity_id / ชื่ออุปกรณ์ / พิกัด / ข้อมูลส่วนตัว) · ทุกค่าอ่านจากเซ็นเซอร์จริง ไม่มีค่าปลอม — ไม่มีค่า = null แล้วหน้าจอซ่อนการ์ดนั้น
// สูตรโซลาร์/โหลดอาคารตรงกับไดอะแกรมพลังงานใน app.js (Huawei PV ก่อน ถ้าไม่มีใช้ solar_p1..p3 รวมกัน)

const GRID_KGCO2E_PER_KWH = 0.475;   // ต้องตรงกับ GRID_ELECTRICITY_KGCO2E_PER_KWH ใน server.js (TGO AR5 v7)

const isUsable = (s) => { const v = String(s ?? "").toLowerCase().trim(); return v !== "" && v !== "unavailable" && v !== "unknown" && v !== "none"; };

function indexStates(states) {
    const m = new Map();
    for (const e of states || []) if (e && e.entity_id) m.set(e.entity_id, e);
    return m;
}

// ค่าตัวเลขของ entity (ลองทั้งชื่อตรงและ prefix ha2.) · คืน null ถ้าใช้ไม่ได้
function numOf(idx, id) {
    const e = idx.get(id) || idx.get("ha2." + id);
    if (!e || !isUsable(e.state)) return null;
    const n = Number(e.state);
    return Number.isFinite(n) ? n : null;
}
const unitOf = (idx, id) => (idx.get(id) || idx.get("ha2." + id))?.attributes?.unit_of_measurement || "";

// พลังงานสะสม → kWh ตามหน่วยที่เซ็นเซอร์รายงาน
function kwhOf(idx, id) {
    const v = numOf(idx, id);
    if (v == null) return null;
    const u = unitOf(idx, id).toLowerCase();
    if (u === "wh") return v / 1000;
    if (u === "mwh") return v * 1000;
    return v;
}
// กำลังไฟ → kW ตามหน่วยที่เซ็นเซอร์รายงาน (W → kW)
function kwOf(idx, id) {
    const v = numOf(idx, id);
    if (v == null) return null;
    return unitOf(idx, id).toLowerCase() === "w" ? v / 1000 : v;
}
function sumKw(idx, ids) {
    const vals = ids.map((id) => kwOf(idx, id)).filter((v) => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
}
const clamp0 = (v) => (v == null ? null : Math.max(0, v));
const round = (v, d = 1) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

function buildSignagePayload(states, { isStale = false, outdoor = null, now = new Date() } = {}) {
    const idx = indexStates(states);
    const solarPhases = clamp0(sumKw(idx, ["sensor.solar_p1", "sensor.solar_p2", "sensor.solar_p3"]));
    const gridKw = clamp0(sumKw(idx, ["sensor.lc_main_p_1", "sensor.lc_main_p_2", "sensor.lc_main_p_3"]));
    const hwPv = kwOf(idx, "sensor.huawei_pv_power");
    const hwAc = kwOf(idx, "sensor.huawei_active_power");
    const solarKw = hwPv != null ? Math.max(0, hwPv) : solarPhases;
    const acKw = hwAc != null ? Math.max(0, hwAc) : solarPhases;
    const homeKw = acKw != null && gridKw != null ? acKw + gridKw : (acKw ?? gridKw);
    const solarKwhTotal = kwhOf(idx, "sensor.solar_energy_delivered");
    const evKwhTotal = kwhOf(idx, "sensor.ev_energy_delivered");
    const office = {
        pm25: numOf(idx, "sensor.am319_pm2_5"), co2: numOf(idx, "sensor.am319_co2"),
        temp: numOf(idx, "sensor.am319_temperature"), humidity: numOf(idx, "sensor.am319_humidity"),
    };
    const out = {
        generated_at: now.toISOString(),
        stale: !!isStale,
        energy: {
            solar_kw: round(solarKw, 2), grid_kw: round(gridKw, 2), home_kw: round(homeKw, 2),
            battery_soc: round(numOf(idx, "sensor.huawei_battery_soc"), 0),
            solar_kwh_total: round(solarKwhTotal, 0),
            co2_avoided_kg: solarKwhTotal != null ? Math.round(solarKwhTotal * GRID_KGCO2E_PER_KWH) : null,
        },
        air: {
            office: { pm25: round(office.pm25, 0), co2: round(office.co2, 0), temp: round(office.temp, 1), humidity: round(office.humidity, 0) },
            outdoor_pm25: outdoor && Number.isFinite(Number(outdoor.pm25)) ? round(Number(outdoor.pm25), 0) : null,
        },
        ev: { kwh_total: round(evKwhTotal, 0) },
    };
    return out;
}

module.exports = { buildSignagePayload, GRID_KGCO2E_PER_KWH };
