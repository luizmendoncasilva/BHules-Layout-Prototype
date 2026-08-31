// Importa (por efeito colateral) todos os módulos de fixtures, registrando
// seus handlers em src/mocks/registry.js. Importado sob demanda por
// src/api/client.js quando VITE_MOCK_DATA=true.
import './companies'
import './invoices'
import './escrituracao'
import './audit'
import './legislation'
import './sped'
import './exceptions'
import './alerts'
import './onboarding'
import './capture'
import './diagnosis'
import './reformDiagnosis'
import './recovery'
import './batchAnalysis'
import './cfopRules'
import './bhubtax'
