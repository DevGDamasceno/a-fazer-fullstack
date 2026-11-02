import { isDemo } from './api'
import { DEMO_EMAIL, DEMO_PASSWORD } from './demoConfig'

export default function DemoNote({ showCredentials = false }) {
  if (!isDemo) return null

  return (
    <div className="demo-note">
      {showCredentials && (
        <p>
          <strong>Para testar,</strong> entre com <code>{DEMO_EMAIL}</code> e a senha <code>{DEMO_PASSWORD}</code>, ou
          crie a sua própria conta.
        </p>
      )}
      <p>
        Modo demonstração: seus dados ficam salvos só neste navegador. A API real (ASP.NET Core) está no{' '}
        <a href="https://github.com/DevGDamasceno/a-fazer-fullstack" target="_blank" rel="noreferrer">
          repositório
        </a>
        .
      </p>
    </div>
  )
}
