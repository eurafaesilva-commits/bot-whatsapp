const {
  default: makeWASocket,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys')

const qrcode = require('qrcode-terminal')
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState('auth')

  const sock = makeWASocket({
    auth: state
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ qr, connection }) => {

    if (qr) {

      console.log('ESCANEIE O QR:')

      qrcode.generate(qr, {
        small: true
      })

    }

    if (connection === 'open') {

      console.log('Bot conectado 🚀')

    }

  })

  sock.ev.on('messages.upsert', async ({ messages }) => {

    const msg = messages[0]

    if (!msg.message) return

    // evita loop infinito
    if (msg.key.fromMe) return

    const text =
      msg.message.conversation || ''

    if (!text) return

    const sender =
      msg.key.remoteJid

    console.log('Mensagem:', text)

    try {

      const response =
        await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Você é um atendente simpático e inteligente.'
            },
            {
              role: 'user',
              content: text
            }
          ]
        })

      const reply =
        response.choices[0].message.content

      await sock.sendMessage(sender, {
        text: reply
      })

    } catch (error) {

      console.log(error)

    }

  })

}

startBot()