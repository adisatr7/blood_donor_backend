export const bloodStorageRoutes = `
/**
 * @swagger
 * /admin/blood-storage:
 *   post:
 *     summary: Set blood storage data
 *     tags:
 *       - Blood Storage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               secretKey:
 *                 type: string
 *                 description: Secret key for authentication
 *               type:
 *                 type: string
 *                 description: Blood type (e.g., A, B, AB, O)
 *               rhesus:
 *                 type: string
 *                 description: Rhesus factor (e.g., POSITIVE, NEGATIVE)
 *               quantity:
 *                 type: integer
 *                 description: Quantity of blood in storage
 *             required:
 *               - secretKey
 *               - type
 *               - rhesus
 *               - quantity
 *     responses:
 *       201:
 *         description: Blood storage data added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     type:
 *                       type: string
 *                     rhesus:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *       400:
 *         description: Invalid request body
 */

/**
 * @swagger
 * /admin/blood-storage:
 *   get:
 *     summary: Get all blood storage data
 *     tags:
 *       - Blood Storage
 *     requestBody:
 *           required: true
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   secretKey:
 *                     type: string
 *                     description: Secret key for authentication
 *     responses:
 *       200:
 *         description: List of all blood storage data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   type:
 *                     type: string
 *                   rhesus:
 *                     type: string
 *                   quantity:
 *                     type: integer
 */
`;

export const userRoutes = `
/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid request body
 *       409:
 *         description: NIK already registered
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - User
 *     requestBody:
 *           required: true
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   secretKey:
 *                     type: string
 *                     description: Secret key for authentication
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserResponse'
 */

/**
 * @swagger
 * /admin/users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags:
 *       - User
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *           required: true
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   secretKey:
 *                     type: string
 *                     description: Secret key for authentication
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/users/{userId}:
 *   patch:
 *     summary: Update a user by ID
 *     tags:
 *       - User
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/users/{userId}/update-profile-picture:
 *   patch:
 *     summary: Upload a new profile picture for a user
 *     tags:
 *       - User
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: User not found
 */
`;

export const locationRoutes = `
/**
 * @swagger
 * /admin/locations:
 *   post:
 *     summary: Create a new location
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationRequest'
 *     responses:
 *       201:
 *         description: Location created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LocationResponse'
 *       400:
 *         description: Invalid request body
 */

/**
 * @swagger
 * /admin/locations/search:
 *   get:
 *     summary: Search locations by name
 *     tags:
 *       - Locations
 *     parameters:
 *       - name: name
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: The name or partial name of the location to search for
 *     responses:
 *       200:
 *         description: List of matching locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LocationResponse'
 *       400:
 *         description: Missing query parameter 'name'
 */

/**
 * @swagger
 * /admin/locations:
 *   get:
 *     summary: Get all locations
 *     tags:
 *       - Locations
 *     responses:
 *       200:
 *         description: List of all locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LocationResponse'
 */

/**
 * @swagger
 * /admin/locations/{id}:
 *   get:
 *     summary: Get a location by ID
 *     tags:
 *       - Locations
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Location details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LocationResponse'
 *       404:
 *         description: Location not found
 */

/**
 * @swagger
 * /admin/locations/{id}:
 *   patch:
 *     summary: Update a location by ID
 *     tags:
 *       - Locations
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationRequest'
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LocationResponse'
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Location not found
 */
`;
