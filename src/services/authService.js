import { supabase, logSupabaseError, logSupabaseData } from './supabase'

/**
 * AUTENTICACIÓN - Métodos para manejar login, signup y sesiones
 */

// Registrar nuevo usuario
export async function signUp(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    logSupabaseData(data.user, 'Usuario registrado')
    return { success: true, data: data.user }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Iniciar sesión
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    logSupabaseData(data.user, 'Sesión iniciada')
    return { success: true, data: data.user, session: data.session }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Cerrar sesión
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    logSupabaseData(null, 'Sesión cerrada')
    return { success: true }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener usuario actual
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) throw error

    return { success: true, data: data.user }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener sesión actual
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) throw error

    return { success: true, data: data.session }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Escuchar cambios de autenticación
export function onAuthStateChanged(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session)
  })

  return data.subscription
}

// Crear cuenta de usuario después del signup
export async function createUserAccount(userId, accountName = 'Mi Cuenta') {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .insert([
        {
          user_id: userId,
          name: accountName,
          balance: 0,
          currency: 'MXN',
        },
      ])
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Cuenta de usuario creada')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener cuentas del usuario autenticado (propias + compartidas)
export async function getUserAccounts(userId, userEmail) {
  try {
    // Obtener cuentas propias
    const { data: ownAccounts, error: ownError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)

    if (ownError) throw ownError

    // Obtener cuentas compartidas (por email)
    const { data: sharedAccounts, error: sharedError } = await supabase
      .from('accounts')
      .select('*')
      .eq('shared_with_email', userEmail)

    if (sharedError) throw sharedError

    // Combinar ambas y marcar cuáles son compartidas
    const allAccounts = [
      ...ownAccounts.map(a => ({ ...a, is_owner: true })),
      ...sharedAccounts.map(a => ({ ...a, is_owner: false, is_shared: true }))
    ]

    logSupabaseData(allAccounts, 'Cuentas obtenidas (propias + compartidas)')
    return { success: true, data: allAccounts }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Compartir cuenta con email
export async function shareAccountWithEmail(accountId, email) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update({ shared_with_email: email })
      .eq('id', accountId)
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Cuenta compartida')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Dejar de compartir cuenta
export async function unshareAccount(accountId) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update({ shared_with_email: null })
      .eq('id', accountId)
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Cuenta no compartida')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}
