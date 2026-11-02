import { isDemo } from './api'

export default function DemoNote() {
  if (!isDemo) return null

  return (
    <p className="demo-note">
      Modo demonstração: seus dados ficam salvos só neste navegador. A API real (ASP.NET Core) está no{' '}
      <a href="https://github.com/DevGDamasceno/a-fazer-fullstack" target="_blank" rel="noreferrer">
        repositório
      </a>
      .
    </p>
  )
}
