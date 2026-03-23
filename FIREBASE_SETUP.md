# Configuración de Firebase - Autenticación con Email/Password

## 🔐 Sistema de Autenticación Implementado

Este proyecto utiliza **Firebase Authentication con email y contraseña**. Los usuarios deben registrarse e iniciar sesión para acceder a la aplicación.

## 📋 Configuración Requerida en Firebase Console

### 1️⃣ **Habilitar Autenticación con Email/Password**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto **"cotizador-10894"**
3. En el menú lateral, ve a **"Authentication"**
4. Click en la pestaña **"Sign-in method"**
5. Habilita **"Email/Password"** (debe estar el primer toggle activado)
6. Guarda los cambios

### 2️⃣ **Configurar Reglas de Firestore**

1. Ve a **"Firestore Database"** en el menú lateral
2. Click en la pestaña **"Rules"**
3. Reemplaza las reglas actuales con las siguientes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura solo para usuarios autenticados con email/password
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
  }
}
```

4. Click **"Publish"** para aplicar los cambios

### 3️⃣ **Configurar Reglas de Storage**

1. Ve a **"Storage"** en el menú lateral
2. Click en la pestaña **"Rules"**
3. Reemplaza con estas reglas:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Solo usuarios autenticados (no anónimos) pueden leer/escribir
      allow read, write: if request.auth != null && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
  }
}
```

4. Click **"Publish"**

## ✅ Características del Sistema de Autenticación

- ✅ Registro de usuarios con email/password
- ✅ Inicio de sesión con credenciales
- ✅ Recuperación de contraseña por email
- ✅ Persistencia de sesión (el usuario permanece logueado)
- ✅ Cierre de sesión seguro
- ✅ Validación de formularios
- ✅ Manejo de errores en español
- ✅ UI moderna con animaciones y gradientes
- ✅ Protección de rutas (solo usuarios autenticados pueden acceder)

## 🎨 Pantallas Implementadas

1. **Login**: Inicio de sesión con email y contraseña
2. **Registro**: Creación de cuenta nueva con nombre, email y contraseña
3. **Recuperación**: Envío de email para resetear contraseña
4. **Dashboard**: Acceso protegido con botón de logout

## 🔒 Seguridad

- Las contraseñas deben tener mínimo 6 caracteres
- Firebase maneja el hash y encriptación de contraseñas automáticamente
- Los tokens de sesión se renuevan automáticamente
- Las reglas de Firestore y Storage protegen los datos

## 🚀 Uso

1. **Primera vez**: Crear cuenta con el botón "Regístrate aquí"
2. **Usuarios existentes**: Iniciar sesión con email y contraseña
3. **Olvidaste contraseña**: Click en "¿Olvidaste tu contraseña?" y sigue las instrucciones del email
4. **Cerrar sesión**: Click en el botón "Salir" en la esquina superior derecha

## 📝 Estado de Configuración

- ✅ Variables de entorno configuradas
- ✅ Firebase instalado y configurado
- ✅ Autenticación con Email/Password implementada
- ✅ Componente LoginForm creado
- ✅ Flujo de autenticación integrado en App.tsx
- ⏳ **Pendiente**: Habilitar Email/Password en Firebase Console
- ⏳ **Pendiente**: Configurar reglas de Firestore y Storage en Firebase Console

## 🛠️ Próximos Pasos

Para que la aplicación funcione correctamente:

1. Ve a Firebase Console
2. Habilita la autenticación con Email/Password
3. Configura las reglas de Firestore y Storage
4. Crea tu primera cuenta desde la pantalla de login
5. ¡Listo! Ya puedes usar la aplicación
