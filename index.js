const {
  default: makeWASocket,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys')

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

  sock.ev.on('connection.update',
    async ({ connection }) => {

      if (connection === 'open') {
        console.log('Bot conectado 🚀')
      }

    })

  // COLOQUE SEU NÚMERO AQUI
  const phoneNumber = '5515991855617'

  setTimeout(async () => {

    const code =
      await sock.requestPairingCode(phoneNumber)

    console.log('\nCÓDIGO:\n')

    console.log(code)

  }, 5000)

  sock.ev.on('messages.upsert',
    async ({ messages }) => {

      const msg = messages[0]

      if (!msg.message) return

      if (msg.key.fromMe) return

      const text =
        msg.message.conversation || ''

      if (!text) return

      const sender =
        msg.key.remoteJid

      try {

        const response =
          await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content:
                  'Você é um atendente simpático.'
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
