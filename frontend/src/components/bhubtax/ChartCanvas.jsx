import { useEffect, useRef } from 'react'
import {
  Chart,
  BarController,
  DoughnutController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

// Chart.js v4 é modular: além de elementos/escalas/plugins, é preciso registrar
// os CONTROLLERS de cada tipo de gráfico usado. Sem BarController/DoughnutController
// o build tree-shaken lança "'doughnut' is not a registered controller" em runtime.
// Tipos usados no dashboard: 'bar' e 'doughnut'.
Chart.register(
  BarController,
  DoughnutController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
)
Chart.defaults.font.family = "'Lato', system-ui, sans-serif"
// Lê o token `--muted-foreground` direto do BSystem (bhub-design-system/src/styles.css,
// já carregado globalmente) em vez de hardcodar o hex. Chart.defaults é setado uma vez
// no module load, antes de qualquer componente montar — nesse ponto o <html> já existe
// no DOM, então getComputedStyle já resolve a variável CSS. Fallback cobre SSR/ambientes
// sem DOM e o caso do token ainda não estar definido.
Chart.defaults.color = (typeof document !== 'undefined'
  ? getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim()
  : '') || '#737373'

// Paleta BSystem dedicada a data-viz (chart-1..5), lida via CSS custom
// properties (mesmo padrão do --muted-foreground acima) em vez de hexcodes
// hardcoded. Séries com mais de 5 itens ciclam (i % 5) — ver uso em
// BHubTaxDashboard.jsx.
export const BRAND_CHART_COLORS = (typeof document !== 'undefined'
  ? (() => {
      const style = getComputedStyle(document.documentElement)
      return [1, 2, 3, 4, 5].map((i) => style.getPropertyValue(`--chart-${i}`).trim())
    })()
  : ['', '', '', '', ''])

/**
 * Wrapper fino do Chart.js para React: cria o gráfico no mount e o destrói no
 * unmount / mudança de config (evita leak de instâncias e canvas reusados).
 */
export default function ChartCanvas({ type, data, options, height = 260 }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  // options é estático por gráfico — recriar só quando type/data mudam evita
  // destruir/recriar a instância a cada render do pai.
  const optionsRef = useRef(options)
  optionsRef.current = options
  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current = new Chart(canvasRef.current, {
      type,
      data,
      options: { responsive: true, maintainAspectRatio: false, ...optionsRef.current },
    })
    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [type, data])

  return (
    <div style={{ position: 'relative', height }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
