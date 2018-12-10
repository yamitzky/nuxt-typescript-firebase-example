import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Storage } from '@google-cloud/storage'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { spawn } from 'child-process-promise'

const gcs = new Storage({ keyFilename: path.resolve(__dirname, '..', 'service-account-credentials.json') })
admin.initializeApp()

export const convertImage = functions.runWith({ memory: '2GB' }).storage.object().onFinalize(async object => {
  const filePath = object.name
  if (!filePath) {
    console.log(object.name, 'is null')
    return
  }

  const [ , partyId, , rest ] = filePath.split(path.sep)
  const fileName = path.basename(filePath)
  if (rest) {
    // ignore files in sub-dir
    console.log(object.name, 'is a thumbnail.')
    return
  }

  const bucket = gcs.bucket(object.bucket)
  const file = bucket.file(filePath)
  const db = admin.firestore()
  const doc = await db.collection('parties').doc(partyId).collection('messages').doc()
  await file.makePublic()
  await doc.set({
    imageURL: `https://storage.googleapis.com/${object.bucket}/${filePath}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  admin.storage().bucket(object.bucket)

  console.log('Converting', filePath)

  const tempFilePath = path.join(os.tmpdir(), fileName)
  const outFilePath = path.join(os.tmpdir(), path.basename(fileName, path.extname(fileName)) + '.jpg')

  await file.download({ destination: tempFilePath })
  console.log('Downloaded', filePath, 'to', tempFilePath)

  await spawn('convert', [tempFilePath, '-auto-orient', '-thumbnail', '800x800>', outFilePath])
  console.log('Converted', tempFilePath, 'to', outFilePath)

  const thumbFileName = `thumb/` + path.basename(outFilePath)
  const thumbFilePath = path.join(path.dirname(filePath), thumbFileName)
  const metadata = { contentType: object.contentType }
  const [ uploaded ] = await bucket.upload(outFilePath, { destination: thumbFilePath, resumable: false, metadata })
  console.log('Uploaded', outFilePath, 'to', thumbFilePath)

  await uploaded.makePublic()
  await doc.update({ thumbURL: `https://storage.googleapis.com/${uploaded.bucket.name}/${uploaded.name}` })

  fs.unlinkSync(tempFilePath)
  fs.unlinkSync(outFilePath)
})
