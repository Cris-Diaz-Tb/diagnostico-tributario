/**
 * Cookie que marca un navegador del equipo: los diagnósticos que nacen en
 * él se guardan con es_prueba = true y no cuentan en el embudo. La ponen
 * `?prueba=1` en cualquier página y el login al panel.
 */
export const COOKIE_PRUEBA = "dd_prueba";
