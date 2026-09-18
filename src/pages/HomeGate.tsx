import { Link } from "react-router-dom";
import { AppearanceSelect } from "../theme/AppearanceSelect";

export function HomeGate() {
  return (
    <main className="home-gate">
      <div className="home-gate-head">
        <span>NEW STORE</span>
        <h1>Escolha o ambiente</h1>
        <p>
          CRM e BI disponíveis para acesso direto pelo time.
        </p>
        <AppearanceSelect />
      </div>
      <div className="home-gate-grid">
        <article>
          <small>Equipe comercial</small>
          <h2>CRM de Vendas</h2>
          <p>Fila de leads, Top 20, historico de compras e acompanhamento de atendimentos - sem login.</p>
          <Link to="/crm">Abrir CRM</Link>
        </article>
        <article>
          <small>Acesso direto</small>
          <h2>Business Intelligence</h2>
          <p>Indicadores, qualidade de dados e sincronizacao Tray, sem login.</p>
          <Link to="/overview">Entrar no BI</Link>
        </article>
      </div>
    </main>
  );
}
