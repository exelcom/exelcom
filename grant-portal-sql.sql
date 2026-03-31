IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app-portal-grc-exelcom-dev')
    CREATE USER [app-portal-grc-exelcom-dev] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [app-portal-grc-exelcom-dev];
ALTER ROLE db_datawriter ADD MEMBER [app-portal-grc-exelcom-dev];
ALTER ROLE db_ddladmin ADD MEMBER [app-portal-grc-exelcom-dev];
