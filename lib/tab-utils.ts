export function getVisibleTabTitles(isCoord: boolean) {
  if (isCoord) {
    return ["Dashboard", "Cadastros", "Admin", "Perfil"];
  }
  return ["Meus Cadastros", "Dashboards", "Perfil"];
}
