import app from './app.js'
import { env } from './config/env.js'

const port = env.PORT

app.listen(port, () => {
  console.log(`Doubt-Chain backend listening on port ${port}`)
})
