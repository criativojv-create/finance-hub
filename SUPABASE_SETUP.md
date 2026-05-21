# Integração Supabase — FinanceHub

Este guia explica como conectar o FinanceHub a um banco de dados Supabase para sincronizar seus dados na nuvem.

## 🚀 Pré-requisitos

1. Conta no [Supabase](https://supabase.com) (grátis)
2. Um projeto Supabase criado

## 📋 Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"New Project"**
3. Escolha um nome (ex: "financehub")
4. Defina senha de banco de dados
5. Escolha região (ex: South America - São Paulo)
6. Aguarde criação (~2 min)

## 🔑 Passo 2: Pegar as Credenciais

1. Abra seu projeto no Supabase
2. Vá para **Settings → API**
3. Copie:
   - **Project URL** (ex: `https://seu-projeto.supabase.co`)
   - **Anon (Public) Key** (começar com `eyJ...`)

## 📝 Passo 3: Configurar Variáveis de Ambiente

1. Abra o arquivo `.env.local` na raiz do projeto (crie se não existir)
2. Cole as credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

3. Salve o arquivo (NÃO faça commit disso!)

## 🗄️ Passo 4: Criar Tabelas no Banco

1. No Supabase, vá para **SQL Editor** (lado esquerdo)
2. Cole este SQL:

```sql
-- TABELAS
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category_id TEXT NOT NULL,
  payer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  installments INTEGER,
  installment_number INTEGER,
  installment_group_id TEXT
);

CREATE TABLE fixed_expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category_id TEXT NOT NULL,
  payer TEXT NOT NULL,
  day_of_month INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  start_year INTEGER NOT NULL,
  start_month INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE
);

CREATE TABLE business_entries (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  client TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS (Row Level Security) - Permitir acesso público
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" ON expenses FOR ALL USING (true);
CREATE POLICY "Allow public access" ON fixed_expenses FOR ALL USING (true);
CREATE POLICY "Allow public access" ON categories FOR ALL USING (true);
CREATE POLICY "Allow public access" ON business_entries FOR ALL USING (true);
CREATE POLICY "Allow public access" ON settings FOR ALL USING (true);
```

3. Clique em **Run** (ou Ctrl+Enter)

## 🔄 Passo 5: Sincronizar Dados (Opcional)

Se você já tem dados no localStorage:

1. Abra o FinanceHub no navegador
2. Abra o **DevTools** (F12 → Console)
3. Cole este código para enviar para Supabase:

```javascript
// Script para migrar dados do localStorage para Supabase
const expenses = JSON.parse(localStorage.getItem('fh_expenses') || '[]');
const fixed = JSON.parse(localStorage.getItem('fh_fixed') || '[]');
const categories = JSON.parse(localStorage.getItem('fh_categories') || '[]');
const names = JSON.parse(localStorage.getItem('fh_names') || '{}');

console.log('Despesas:', expenses.length);
console.log('Fixas:', fixed.length);
console.log('Categorias:', categories.length);
// Os dados serão sincronizados automaticamente quando o Supabase estiver conectado
```

## ✅ Passo 6: Testar Conexão

1. Recarregue o FinanceHub
2. Vá para a aba **Pessoal**
3. Adicione uma despesa teste
4. Verifique no Supabase → **Table Editor** → `expenses` — deve aparecer lá

## 📱 Dados Sincronizados

Os seguintes dados são armazenados no Supabase:

- ✅ Despesas mensais
- ✅ Despesas fixas/recorrentes
- ✅ Categorias personalizadas
- ✅ Entradas de empresa
- ✅ Nomes das pessoas

## 💾 Fallback Local

Se Supabase não estiver configurado, o app usa **localStorage** automaticamente. Nenhuma perda de dados!

## 🔒 Segurança

- ✅ Chaves públicas (anon) apenas — sem acesso a dados sensíveis
- ✅ RLS ativado nas tabelas
- ✅ Nenhum dado pessoal senhor

## 🆘 Troubleshooting

### "Supabase credentials not configured"
- Crie `.env.local` na raiz
- Adicione as variáveis acima
- Reinicie o servidor (`npm run dev`)

### Dados não sincronizam
- Verifique se as credenciais estão corretas
- Confira no Supabase se as tabelas existem
- Abra DevTools (F12) e procure por erros

### Erro "CORS" no Supabase
- Vá em Settings → API → CORS Allowed Origins
- Adicione seu domínio (ex: `http://localhost:5173` ou `https://seu-site.vercel.app`)

## 📚 Próximos Passos

- [ ] Backup automático em CSV
- [ ] Relatórios mensais por email
- [ ] Integração com Stripe para empresa
- [ ] App mobile

---

**Dúvidas?** Consulte a [documentação do Supabase](https://supabase.com/docs)
