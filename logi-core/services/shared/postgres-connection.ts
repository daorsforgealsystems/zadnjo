import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/logistics'
const sql = postgres(connectionString)

export default sql