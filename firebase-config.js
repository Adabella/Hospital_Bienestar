// firebase-config.js (versión mejorada)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  setDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtve3i6HRbmigXrRIXNa8A2KmNCItqurw",
  authDomain: "hospital-bienestar.firebaseapp.com",
  databaseURL: "https://hospital-bienestar-default-rtdb.firebaseio.com",
  projectId: "hospital-bienestar",
  storageBucket: "hospital-bienestar.firebasestorage.app",
  messagingSenderId: "296686621012",
  appId: "1:296686621012:web:2664e71671f69ec17278c1",
  measurementId: "G-MKGBB47XMV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============ FUNCIONES DE AUTENTICACIÓN ============

// Registro de usuario con rol específico
async function registerUser(email, password, userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    const userDoc = {
      uid,
      email,
      nombre: userData.nombre,
      apellidos: userData.apellidos,
      rol: userData.rol,
      activo: true,
      creadoEn: serverTimestamp(),
      ultimoAcceso: serverTimestamp()
    };
    
    if (userData.rol === 'doctor') {
      userDoc.especialidad = userData.especialidad;
      userDoc.cedula = userData.cedula;
      userDoc.horario = userData.horario || [];
    }
    
    if (userData.rol === 'enfermera') {
      userDoc.numEmpleado = userData.numEmpleado;
      userDoc.area = userData.area;
    }
    
    if (userData.rol === 'limpieza') {
      userDoc.numEmpleado = userData.numEmpleado;
      userDoc.zonaAsignada = userData.zonaAsignada;
    }
    
    if (userData.rol === 'paciente') {
      userDoc.curp = userData.curp;
      userDoc.telefono = userData.telefono;
      userDoc.fechaNacimiento = userData.fechaNacimiento;
      userDoc.direccion = userData.direccion || '';
    }
    
    await setDoc(doc(db, 'usuarios', uid), userDoc);
    
    // Enviar email de verificación para admins y doctores
    if (userData.rol === 'admin' || userData.rol === 'doctor') {
      await sendEmailVerification(userCredential.user);
    }
    
    return { success: true, uid, user: userCredential.user };
  } catch (error) {
    console.error("Error en registro:", error);
    return { success: false, error: error.message };
  }
}

// Inicio de sesión
async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    await updateDoc(doc(db, 'usuarios', uid), {
      ultimoAcceso: serverTimestamp()
    });
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Obtener datos del usuario actual
async function getCurrentUserData() {
  const user = auth.currentUser;
  if (!user) return null;
  
  const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
  if (!userDoc.exists()) return null;
  
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    ...userDoc.data()
  };
}

// Verificar si el usuario tiene un rol específico
async function hasRole(requiredRole) {
  const userData = await getCurrentUserData();
  if (!userData) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userData.rol);
  }
  return userData.rol === requiredRole;
}

// Obtener el rol de un usuario por su UID
async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'usuarios', uid));
    if (userDoc.exists()) {
      return userDoc.data().rol;
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo rol:", error);
    return null;
  }
}

// Verificar si el usuario actual es administrador
async function isAdmin() {
  const user = auth.currentUser;
  if (!user) return false;
  
  const userData = await getCurrentUserData();
  return userData?.rol === 'admin';
}

// Redirigir según el rol del usuario
async function redirectByRole() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  
  const userData = await getCurrentUserData();
  if (!userData) {
    window.location.href = '/login.html';
    return;
  }
  
  const roleRoutes = {
    'admin': '/portal.admin.html',
    'doctor': '/admin.html',
    'enfermera': '/admin.html',
    'limpieza': '/admin.html',
    'paciente': '/citas.html'
  };
  
  const redirectUrl = roleRoutes[userData.rol] || '/citas.html';
  window.location.href = redirectUrl;
}

// Recuperar contraseña
async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Cerrar sesión
function logoutUser() {
  return signOut(auth);
}

// ============ FUNCIONES DE GESTIÓN DE USUARIOS ============

async function getUsersByRole(rol) {
  const usersRef = collection(db, 'usuarios');
  const q = query(usersRef, where('rol', '==', rol));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getAllUsers() {
  const usersRef = collection(db, 'usuarios');
  const querySnapshot = await getDocs(usersRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function updateUser(uid, data) {
  const userRef = doc(db, 'usuarios', uid);
  await updateDoc(userRef, {
    ...data,
    actualizadoEn: serverTimestamp()
  });
}

async function toggleUserStatus(uid, activo) {
  const userRef = doc(db, 'usuarios', uid);
  await updateDoc(userRef, { activo });
}

async function deactivateUser(uid) {
  const userRef = doc(db, 'usuarios', uid);
  await updateDoc(userRef, { 
    activo: false,
    desactivadoEn: serverTimestamp()
  });
}

// ============ FUNCIONES DE CITAS ============

async function createAppointment(citaData) {
  try {
    const citasRef = collection(db, 'citas');
    const newCita = {
      ...citaData,
      estado: 'pendiente',
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    };
    const docRef = await addDoc(citasRef, newCita);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getPatientAppointments(patientId) {
  const citasRef = collection(db, 'citas');
  const q = query(
    citasRef, 
    where('pacienteId', '==', patientId),
    orderBy('fecha', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getDoctorAppointments(doctorId, fecha) {
  const citasRef = collection(db, 'citas');
  let q = query(
    citasRef,
    where('medicoId', '==', doctorId),
    orderBy('fecha', 'desc')
  );
  
  if (fecha) {
    q = query(q, where('fecha', '==', fecha));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function updateAppointmentStatus(citaId, estado) {
  const citaRef = doc(db, 'citas', citaId);
  await updateDoc(citaRef, {
    estado,
    actualizadoEn: serverTimestamp()
  });
}

// ============ FUNCIONES DE PACIENTES ============

async function registerPatient(patientData) {
  try {
    const registerResult = await registerUser(
      patientData.email,
      patientData.password,
      {
        nombre: patientData.nombre,
        apellidos: patientData.apellidos,
        rol: 'paciente',
        curp: patientData.curp,
        telefono: patientData.telefono,
        fechaNacimiento: patientData.fechaNacimiento,
        direccion: patientData.direccion
      }
    );
    
    if (registerResult.success) {
      const expedienteRef = doc(db, 'pacientes', registerResult.uid);
      await setDoc(expedienteRef, {
        uid: registerResult.uid,
        historialMedico: [],
        alergias: patientData.alergias || [],
        enfermedadesCronicas: patientData.enfermedadesCronicas || [],
        medicamentosActuales: patientData.medicamentosActuales || [],
        createdAt: serverTimestamp()
      });
    }
    
    return registerResult;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ FUNCIONES DE REGISTRO DE SIGNOS VITALES ============

async function registerVitalSigns(pacienteId, signosData) {
  const signosRef = collection(db, 'signosVitales');
  await addDoc(signosRef, {
    pacienteId,
    ...signosData,
    registradoPor: auth.currentUser?.uid,
    fecha: serverTimestamp()
  });
}

async function getVitalSignsHistory(pacienteId, limit = 10) {
  const signosRef = collection(db, 'signosVitales');
  const q = query(
    signosRef,
    where('pacienteId', '==', pacienteId),
    orderBy('fecha', 'desc'),
    limit(limit)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Exportar todo
export {
  auth,
  db,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUserData,
  hasRole,
  getUserRole,
  isAdmin,
  redirectByRole,
  resetPassword,
  getUsersByRole,
  getAllUsers,
  updateUser,
  toggleUserStatus,
  deactivateUser,
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  registerPatient,
  registerVitalSigns,
  getVitalSignsHistory
};