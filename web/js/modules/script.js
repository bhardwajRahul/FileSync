import { dom } from './dom.js';
import { User } from './webrtc/user.js';

// Room ID
const room_id = window.location.pathname.substring(1)

// Store current user
var user;

// QR Code
var qr = new QRious({
  element: document.getElementById('transfer-qr-code'),
  background: 'transparent',
  size: 220,
  foreground: '#adb5db',
  level: 'H',
})

// Get theme mode
if (window.localStorage.getItem('mode') == 'light') {
  dom.theme_text.innerHTML = 'Light'
  dom.comic_img.src = "assets/comic.png"
  qr.set({foreground: '#212529'});
}

// Load app version from API
async function loadVersion() {
  const res = await fetch('/api/');
  const data = await res.json();
  document.getElementById('appVersion').textContent = `v${data.version}`;
}

// On Load
async function onLoad() {
  // Load version badge
  await loadVersion();

  // Create current user
  user = new User(room_id)

  // Host
  if (room_id.length == 0) {
    // Generate Room ID
    const new_room_id = generateRoomID()

    // Init UI Components
    dom.transfer_div.style.display = 'block'
    dom.transfer_url_value.innerHTML = `${window.location.origin}/${new_room_id}`
    dom.transfer_users_list_host_name.innerHTML = user.name + ' (You)'
    dom.transfer_users_count.innerHTML = ' (1)'
    dom.transfer_add_password.style.display = 'block';
    qr.set({value: dom.transfer_url_value.innerHTML});

    // Init peer connection
    await user.init(new_room_id)
  }
  // Peer
  else {
    // Init UI Componente
    dom.connect_div.style.display = 'block'
    dom.transfer_url_value.innerHTML = `${window.location.origin}/${room_id}`
    qr.set({value: dom.transfer_url_value.innerHTML});

    // Init peer connection
    await user.init()

    // Connect to the room
    await user.connect(room_id)
  }
}

// Theme
function themeClick() {
  if (dom.theme_text.innerHTML == 'Dark') {
    dom.theme_text.innerHTML = 'Light'
    document.documentElement.classList.remove("dark")
    document.documentElement.classList.add("light")
    document.documentElement.setAttribute('data-bs-theme', 'light')
    window.localStorage.setItem('mode', 'light')
    dom.comic_img.src = "assets/comic.png"
    qr.set({foreground: '#212529'});
  }
  else if (dom.theme_text.innerHTML == 'Light') {
    dom.theme_text.innerHTML = 'Dark'
    document.documentElement.classList.remove("light")
    document.documentElement.classList.add("dark")
    document.documentElement.setAttribute('data-bs-theme', 'dark')
    window.localStorage.setItem('mode', 'dark')
    dom.comic_img.src = "assets/comic-dark.png"
    qr.set({foreground: '#adb5db'});
  }
}
window.themeClick = themeClick;

// About
function aboutClick() {
  if (dom.about_text.innerHTML == 'About') {
    dom.transfer_div.style.display = 'none'
    dom.about_div.style.display = 'block'
    dom.about_text.innerHTML = 'Go back'
  }
  else {
    dom.about_div.style.display = 'none'
    dom.about_text.innerHTML = 'About'
    dom.transfer_div.style.display = 'block'
  }
}
window.aboutClick = aboutClick;

function addPassword() {
  const modal = new bootstrap.Modal(dom.password_modal)
  modal.show()
}
window.addPassword = addPassword;

// Show / Hide password
function togglePasswordVisibility(input_name, button_show_name, button_hide_name) {
  var password_input = document.getElementById(input_name)
  var password_button_show = document.getElementById(button_show_name)
  var password_button_hide = document.getElementById(button_hide_name)
  if (password_input.type === "password") {
    password_input.type = "text"
    password_button_show.style.display = 'block'
    password_button_hide.style.display = 'none'
  } else {
    password_input.type = "password"
    password_button_show.style.display = 'none'
    password_button_hide.style.display = 'block'
  }
  password_input.focus()
}
window.togglePasswordVisibility = togglePasswordVisibility;

// Confirm change password
function addPasswordSubmit() {
  user.password = dom.password_modal_value.value.trim()
  const modal = bootstrap.Modal.getInstance(dom.password_modal);
  modal.hide()
  dom.transfer_status_protected.style.display = user.password.length == 0 ? 'none' : 'inline-block'
  showToast(user.password.length == 0 ? 'Password removed.' : 'Password set.')
}
window.addPasswordSubmit = addPasswordSubmit;

function connectWithPassword() {
  if (dom.password_input.value.trim().length == 0) {
    dom.password_error.style.display = 'block'
  }
  else {
    user.password = dom.password_input.value
    dom.password_error.style.display = 'none'
    dom.password_submit.setAttribute("disabled", "")
    dom.password_loading.style.display = 'inline-block'
    user.connect(room_id)
  }
}
window.connectWithPassword = connectWithPassword;

// Change name
function changeName() {
  dom.name_modal_value.value = ''

  const modal = new bootstrap.Modal(dom.name_modal)
  modal.show()
}
window.changeName = changeName;

function changeNameSubmit() {
  // Update name
  user.changeName(dom.name_modal_value.value.trim())
}
window.changeNameSubmit = changeNameSubmit;

// Copy Room url
function copyURL() {
  const url = dom.transfer_url_value.innerHTML;
  if (navigator.clipboard && window.isSecureContext) {
    // Secure context (HTTPS)
    navigator.clipboard.writeText(url)
  }
  else {
    // Fallback for HTTP
    const textarea = document.createElement("textarea");
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  showToast("URL copied.")
  dom.transfer_url_copy.style.display = 'none'
  dom.transfer_url_success.style.display = 'flex'

  setTimeout(() => {
    dom.transfer_url_success.style.display = 'none'
    dom.transfer_url_copy.style.display = 'flex'
  }, 1000)
}
window.copyURL = copyURL;

// Send File
function sendFiles(event) {
  user.addFiles(event.files)
}
window.sendFiles = sendFiles;

// Remove file
function removeFile(fileId) {
  user.removeFile(fileId)
}
window.removeFile = removeFile;

// Download File
function downloadFile(id) {
  user.downloadFile(id)
}
window.downloadFile = downloadFile;

// Abort File (Stop file download)
function abortFile(fileId) {
  user.abortFile(fileId)
}
window.abortFile = abortFile;

// See details
function showFileDetails(fileId) {
  user.showFileDetails(fileId)
}
window.showFileDetails = showFileDetails;

// Download all
function downloadAll() {
  user.downloadAll()
}
window.downloadAll = downloadAll;

// Cancel download all
function cancelDownloadAll() {
  user.downloadAllCancel()
}
window.cancelDownloadAll = cancelDownloadAll;

// Toast notification
let _toastTimeout = null;
function showToast(message, type = 'success') {
  const toast = document.getElementById('notification-toast')
  const toastValue = document.getElementById('notification-toast-value')
  const iconSuccess = document.getElementById('notification-toast-icon-success')
  const iconWarning = document.getElementById('notification-toast-icon-warning')
  if (!toast || !toastValue) return
  toastValue.textContent = message
  // Toggle icon based on type
  if (iconSuccess && iconWarning) {
    iconSuccess.style.display = type === 'warning' ? 'none' : 'inline'
    iconWarning.style.display = type === 'warning' ? 'inline' : 'none'
  }
  // Clear any existing timeout
  if (_toastTimeout) clearTimeout(_toastTimeout)
  // Show
  toast.style.opacity = '1'
  toast.style.transform = 'translateX(-50%) translateY(0)'
  // Auto-hide after 2s
  _toastTimeout = setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(-50%) translateY(-100px)'
  }, 2000)
}
window.showToast = showToast;

// Drag and Drop on transfer-div
function initDropZone() {
  const transferDiv = document.getElementById('transfer-div')
  if (!transferDiv) return

  // Prevent browser default drag behavior globally
  window.addEventListener('dragover', (e) => e.preventDefault())
  window.addEventListener('drop', (e) => e.preventDefault())

  let dragCounter = 0

  transferDiv.addEventListener('dragenter', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter++
    transferDiv.classList.add('drag-over')
  })

  transferDiv.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })

  transferDiv.addEventListener('dragleave', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter--
    if (dragCounter === 0) {
      transferDiv.classList.remove('drag-over')
    }
  })

  transferDiv.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter = 0
    transferDiv.classList.remove('drag-over')
    const files = e.dataTransfer.files
    if (files.length > 0) {
      user.addFiles(files)
    }
  })
}

// Function to generate a random string in the format XXX-XXXX-XXX.
function generateRoomID() {
  const length = 10
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const random = crypto.getRandomValues(new Uint8Array(length));
  let room_id = "";
  for (let i = 0; i < length; i++) {
    room_id += alphabet[random[i] % alphabet.length];
  }
  return `${room_id.slice(0, 3)}-${room_id.slice(3, 7)}-${room_id.slice(7, 10)}`;
}

// On document loaded, execute onLoad() method.
(() => {
  onLoad()
  initDropZone()
})();