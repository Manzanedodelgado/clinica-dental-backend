/**
 * Controlador de Autenticación
 * Sistema de Gestión Dental - Rubio García Dental
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbConfig, SQL_QUERIES } = require('../config/database');

class AuthController {
    /**
     * Iniciar sesión
     */
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            // Buscar usuario en base de datos
            const userQuery = `
                SELECT UserID, Username, Email, PasswordHash, Role, FirstName, LastName, IsActive, LastLogin
                FROM DUsers 
                WHERE (Username = @username OR Email = @username) AND IsActive = 1
            `;

            const result = await dbConfig.query(userQuery, [
                { name: 'username', value: username }
            ]);

            if (result.recordset.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            const user = result.recordset[0];

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Actualizar último login
            await dbConfig.query(`
                UPDATE DUsers SET LastLogin = GETDATE() WHERE UserID = @userId
            `, [{ name: 'userId', value: user.UserID }]);

            // Generar tokens
            const accessToken = jwt.sign(
                { 
                    userId: user.UserID, 
                    username: user.Username, 
                    role: user.Role 
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            const refreshToken = jwt.sign(
                { userId: user.UserID },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
            );

            // Datos del usuario para respuesta (sin contraseña)
            const userData = {
                id: user.UserID,
                username: user.Username,
                email: user.Email,
                role: user.Role,
                firstName: user.FirstName,
                lastName: user.LastName,
                lastLogin: user.LastLogin
            };

            res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: {
                    user: userData,
                    tokens: {
                        accessToken,
                        refreshToken,
                        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                    }
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'LOGIN_SERVER_ERROR'
            });
        }
    }

    /**
     * Cerrar sesión
     */
    static async logout(req, res) {
        try {
            // En una implementación más robusta, aquí se podría invalidar el token
            // agregando a una lista negra o registrando la sesión como cerrada
            
            res.json({
                success: true,
                message: 'Sesión cerrada exitosamente'
            });

        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'LOGOUT_SERVER_ERROR'
            });
        }
    }

    /**
     * Renovar token de acceso
     */
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    error: 'Token de actualización requerido',
                    code: 'REFRESH_TOKEN_REQUIRED'
                });
            }

            // Verificar token de actualización
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

            // Verificar que el usuario aún existe y está activo
            const userQuery = `
                SELECT UserID, Username, Email, Role, IsActive
                FROM DUsers 
                WHERE UserID = @userId AND IsActive = 1
            `;

            const result = await dbConfig.query(userQuery, [
                { name: 'userId', value: decoded.userId }
            ]);

            if (result.recordset.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no válido o inactivo',
                    code: 'USER_INVALID'
                });
            }

            const user = result.recordset[0];

            // Generar nuevo token de acceso
            const accessToken = jwt.sign(
                { 
                    userId: user.UserID, 
                    username: user.Username, 
                    role: user.Role 
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.json({
                success: true,
                data: {
                    accessToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            });

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token de actualización expirado',
                    code: 'REFRESH_TOKEN_EXPIRED'
                });
            }

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token de actualización inválido',
                    code: 'REFRESH_TOKEN_INVALID'
                });
            }

            console.error('Error renovando token:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'REFRESH_TOKEN_SERVER_ERROR'
            });
        }
    }

    /**
     * Obtener perfil de usuario
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user.UserID;

            const profileQuery = `
                SELECT 
                    UserID, Username, Email, Role, FirstName, LastName,
                    Phone, IsActive, CreatedAt, LastLogin
                FROM DUsers 
                WHERE UserID = @userId AND IsActive = 1
            `;

            const result = await dbConfig.query(profileQuery, [
                { name: 'userId', value: userId }
            ]);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado',
                    code: 'USER_NOT_FOUND'
                });
            }

            const user = result.recordset[0];

            res.json({
                success: true,
                data: {
                    id: user.UserID,
                    username: user.Username,
                    email: user.Email,
                    role: user.Role,
                    firstName: user.FirstName,
                    lastName: user.LastName,
                    phone: user.Phone,
                    isActive: user.IsActive,
                    createdAt: user.CreatedAt,
                    lastLogin: user.LastLogin
                }
            });

        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'PROFILE_SERVER_ERROR'
            });
        }
    }

    /**
     * Cambiar contraseña
     */
    static async changePassword(req, res) {
        try {
            const userId = req.user.UserID;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña actual y nueva contraseña son requeridas',
                    code: 'PASSWORD_REQUIRED'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'La nueva contraseña debe tener al menos 6 caracteres',
                    code: 'PASSWORD_TOO_SHORT'
                });
            }

            // Obtener contraseña actual
            const userQuery = `
                SELECT PasswordHash FROM DUsers WHERE UserID = @userId
            `;

            const result = await dbConfig.query(userQuery, [
                { name: 'userId', value: userId }
            ]);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Verificar contraseña actual
            const isValidPassword = await bcrypt.compare(currentPassword, result.recordset[0].PasswordHash);
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña actual incorrecta',
                    code: 'INVALID_CURRENT_PASSWORD'
                });
            }

            // Hash de nueva contraseña
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            // Actualizar contraseña
            await dbConfig.query(`
                UPDATE DUsers 
                SET PasswordHash = @newPasswordHash, UpdatedAt = GETDATE()
                WHERE UserID = @userId
            `, [
                { name: 'newPasswordHash', value: newPasswordHash },
                { name: 'userId', value: userId }
            ]);

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'CHANGE_PASSWORD_SERVER_ERROR'
            });
        }
    }

    /**
     * Registrar nuevo usuario (solo para administradores)
     */
    static async register(req, res) {
        try {
            const { username, email, password, firstName, lastName, role, phone } = req.body;

            // Verificar si el usuario ya existe
            const existingUserQuery = `
                SELECT 1 FROM DUsers WHERE Username = @username OR Email = @email
            `;

            const existingResult = await dbConfig.query(existingUserQuery, [
                { name: 'username', value: username },
                { name: 'email', value: email }
            ]);

            if (existingResult.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Usuario o email ya existe',
                    code: 'USER_EXISTS'
                });
            }

            // Hash de contraseña
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Crear usuario
            const createUserQuery = `
                INSERT INTO DUsers (
                    Username, Email, PasswordHash, FirstName, LastName, 
                    Phone, Role, IsActive, CreatedAt, UpdatedAt
                )
                VALUES (
                    @username, @email, @passwordHash, @firstName, @lastName,
                    @phone, @role, 1, GETDATE(), GETDATE()
                )
                SELECT SCOPE_IDENTITY() as UserID
            `;

            const result = await dbConfig.query(createUserQuery, [
                { name: 'username', value: username },
                { name: 'email', value: email },
                { name: 'passwordHash', value: passwordHash },
                { name: 'firstName', value: firstName },
                { name: 'lastName', value: lastName },
                { name: 'phone', value: phone },
                { name: 'role', value: role }
            ]);

            const newUserId = result.recordset[0].UserID;

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    id: newUserId,
                    username,
                    email,
                    firstName,
                    lastName,
                    role
                }
            });

        } catch (error) {
            console.error('Error registrando usuario:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'REGISTER_SERVER_ERROR'
            });
        }
    }
}

module.exports = AuthController;