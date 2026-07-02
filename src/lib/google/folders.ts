// Google Drive Folder Helper
// Auto-creates folder structure: Hadi Kaya docs > [Perumahan] > Berkas Konsumen > [Nama - Blok]
import { getDriveClientOAuth } from './auth'

const ROOT_FOLDER_NAME = 'Hadi Kaya Docs'

// Find or create a folder by name in a parent folder (or root if no parent)
export async function ensureFolder(name: string, parentId?: string): Promise<string> {
  const drive = await getDriveClientOAuth()

  // Search for existing folder
  const query = parentId
    ? `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 1,
  })

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id || '' // Folder exists
  }

  // Create folder
  const createRes = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id',
  })

  return createRes.data.id || ''
}

// Ensure full folder path exists and return the leaf folder ID
// Structure: Hadi Kaya Docs > [Perumahan] > Berkas Konsumen > [Nama Konsumen - Blok Unit]
export async function ensureCustomerFolder(state: any, customerId?: string): Promise<string> {
  const projectName = state?.property?.projectName || 'Anjayo 16'
  const customerName = state?.applicant?.fullName || 'Unknown'
  const block = state?.property?.blockLetter || ''
  const houseNumber = state?.property?.houseNumber || ''
  const blockUnit = block || houseNumber ? ` - ${block}${houseNumber}` : ''
  const customerFolderName = `${customerName}${blockUnit}`

  // Create nested folders
  const rootId = await ensureFolder(ROOT_FOLDER_NAME)
  const perumahanId = await ensureFolder(projectName, rootId)
  const berkasId = await ensureFolder('Berkas Konsumen', perumahanId)
  const customerId2 = await ensureFolder(customerFolderName, berkasId)

  return customerId2
}
