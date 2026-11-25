// Executa uma vez quando o servidor inicia. Importar o env aqui faz a aplicação
// falhar na inicialização, com mensagem clara, se faltar alguma variável.
export async function register() {
  await import("@/config/env");
}
