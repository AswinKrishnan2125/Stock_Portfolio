import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Set up axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUserProfile()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/auth/profile/')
      setUser(response.data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login/', {
        username,
        password
      })
      
      const { access, refresh, user: userData } = response.data
      
      localStorage.setItem('token', access)
      localStorage.setItem('refreshToken', refresh)
      
      setToken(access)
      setUser(userData)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register/', userData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Registration error:', error)
      const errorData = error.response?.data
      let errorMessage = 'Registration failed'
      
      if (errorData?.error) {
        errorMessage = errorData.error
        if (errorData.details) {
          // Format validation errors
          const details = errorData.details
          if (typeof details === 'object') {
            const fieldErrors = Object.entries(details).map(([field, errors]) => 
              `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`
            ).join('; ')
            errorMessage += ` - ${fieldErrors}`
          }
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken')
      if (!refresh) {
        throw new Error('No refresh token')
      }

      const response = await axios.post('/auth/refresh/', {
        refresh
      })
      
      const { access } = response.data
      localStorage.setItem('token', access)
      setToken(access)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
      
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      return false
    }
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
