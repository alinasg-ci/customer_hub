-- Exchange rate cache table
CREATE TABLE exchange_rates (
  date date NOT NULL,
  currency text NOT NULL CHECK (currency IN ('USD', 'EUR')),
  rate_to_ils decimal(12,6) NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (date, currency)
);
