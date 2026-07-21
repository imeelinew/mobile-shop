import CryptoJS from 'crypto-js'

const SECRET_KEY = 'shopkey-password'

export const encryptPassword = (password) => {
    const content = `${Date.now()}${password}`

    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY)
    const data = CryptoJS.enc.Utf8.parse(content)

    return CryptoJS.AES.encrypt(data, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    }).toString()
}