const sendMail = require("../../utils/sendMail")

const testSendMail = async (req, res) => {
          try {
                    const emailOptions = { 
                              to: 'mbagapro@gmail.com',
                              subject: 'Test email'
                    }
                    const info = await sendMail(emailOptions, 'test_email', { username: 'dukizwe' })
                    res.status(200).json(info)
          } catch (error) {
                    console.log(error)
                    res.staus(500).send("Server error")
          }
}

const renderPrivacy = (req, res) => {
          try {
                    res.status(200).render('privacy')
          } catch (error) {
                    console.log(error)
                    res.staus(500).send("Server error")
          }
}

module.exports = {
          testSendMail,
          renderPrivacy
}