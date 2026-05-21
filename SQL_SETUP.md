# 🚀 Setup do Supabase (SQL)

Cole o SQL abaixo no **Supabase SQL Editor** para criar as tabelas.

## 1. Abra o SQL Editor
- Acesse: https://supabase.com → Seu Projeto
- Menu lateral → **SQL Editor**
- Clique em "New Query"

## 2. Cole o SQL completo abaixo:

```sql
-- Tabela: expenses (despesas)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  category_id TEXT NOT NULL,
  payer TEXT NOT NULL,
  installments INTEGER,
  installment_number INTEGER,
  installment_group_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: fixed_expenses (despesas fixas/recorrentes)
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category_id TEXT NOT NULL,
  payer TEXT NOT NULL,
  day_of_month INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  start_year INTEGER NOT NULL,
  start_month INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: categories (categorias)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: business_entries (negócios)
CREATE TABLE IF NOT EXISTS business_entries (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  client TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: settings (configurações)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) - Desabilitado para demo pública
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
```

## 3. Execute o SQL
Clique em "Run" (ícone ▶️)

## 4. Pronto! ✅
A página vai recarregar e os dados começam a sincronizar.

---

## ⚙️ Se quiser usar seu próprio Supabase:

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto (gratuito)
3. Pegue as credenciais:
   - Project URL
   - Anon Key
4. Atualize o arquivo `.env.local`:
   ```env
   VITE_SUPABASE_URL=sua-url
   VITE_SUPABASE_ANON_KEY=sua-chave
   ```
5. Cole o SQL acima no SQL Editor
6. Pronto!

---

**Dúvidas?** Verifique se o `.env.local` tem as credenciais corretas.
