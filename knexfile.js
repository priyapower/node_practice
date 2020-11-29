module.exports = {
  development: {
    client: 'pg',
    connection: 'postgress://localhost/publications',
    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeds/dev'
    },
    useNullasDefault: true
  }
};
