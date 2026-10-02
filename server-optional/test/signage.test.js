const test = require("node:test");
const assert = require("node:assert");
const { buildSignagePayload } = require("../lib/signage");

const st = (entity_id, state, unit) => ({ entity_id, state: String(state), attributes: unit ? { unit_of_measurement: unit } : {} });
const now = new Date("2026-10-02T03:00:00Z");

test("solar uses Huawei PV when present, building load = inverter AC + grid", () => {
  const p = buildSignagePayload([
    st("sensor.huawei_pv_power", 1.17, "kW"), st("sensor.huawei_active_power", 1.45, "kW"),
    st("sensor.solar_p1", -0.64, "kW"), st("sensor.solar_p2", 0.5, "kW"), st("sensor.solar_p3", 0.4, "kW"),
    st("sensor.lc_main_p_1", 2, "kW"), st("sensor.lc_main_p_2", 1, "kW"), st("sensor.lc_main_p_3", 1, "kW"),
  ], { now });
  assert.equal(p.energy.solar_kw, 1.17);
  assert.equal(p.energy.grid_kw, 4);
  assert.equal(p.energy.home_kw, 5.45);
});

test("falls back to the three solar phases (clamped at 0) without Huawei", () => {
  const p = buildSignagePayload([st("sensor.solar_p1", 1, "kW"), st("sensor.solar_p2", 0.5, "kW"), st("sensor.solar_p3", 0.25, "kW")], { now });
  assert.equal(p.energy.solar_kw, 1.75);
  const neg = buildSignagePayload([st("sensor.solar_p1", -0.2, "kW")], { now });
  assert.equal(neg.energy.solar_kw, 0);
});

test("watts are converted to kW and Wh/MWh to kWh", () => {
  const p = buildSignagePayload([st("sensor.huawei_pv_power", 1500, "W"), st("sensor.solar_energy_delivered", 12000000, "Wh"), st("sensor.ev_energy_delivered", 2, "MWh")], { now });
  assert.equal(p.energy.solar_kw, 1.5);
  assert.equal(p.energy.solar_kwh_total, 12000);
  assert.equal(p.ev.kwh_total, 2000);
  assert.equal(p.energy.co2_avoided_kg, Math.round(12000 * 0.475));
});

test("unavailable / missing values become null, never a made-up number", () => {
  const p = buildSignagePayload([st("sensor.am319_pm2_5", "unavailable"), st("sensor.am319_co2", 640, "ppm")], { now });
  assert.equal(p.air.office.pm25, null);
  assert.equal(p.air.office.co2, 640);
  assert.equal(p.air.office.temp, null);
  assert.equal(p.energy.solar_kw, null);
  assert.equal(p.energy.co2_avoided_kg, null);
  assert.equal(p.air.outdoor_pm25, null);
});

test("outdoor PM2.5 comes from the outdoor station; stale flag passes through; no entity ids leak", () => {
  const p = buildSignagePayload([st("sensor.am319_pm2_5", 9, "µg/m³")], { isStale: true, outdoor: { pm25: 31.4 }, now });
  assert.equal(p.air.outdoor_pm25, 31);
  assert.equal(p.air.office.pm25, 9);
  assert.equal(p.stale, true);
  assert.doesNotMatch(JSON.stringify(p), /sensor\./);
});

test("works with the second HA's ha2. prefix", () => {
  const p = buildSignagePayload([st("ha2.sensor.am319_am319_co2", 1, "ppm"), st("ha2.sensor.am319_co2", 700, "ppm")], { now });
  assert.equal(p.air.office.co2, 700);
});
