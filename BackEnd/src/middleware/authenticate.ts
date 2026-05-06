import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { env } from '../config/env'
import type { IUser } from '../interfaces/user.interface'

export type RequestWithUser = Request & { user?: IUser }

/**
 * Verifies a bearer token and attaches the decoded user to the request.
 * @param request Express request extended with the optional user field.
 * @param response Express response object.
 * @param next Express next callback.
 */
export function authenticate(request: RequestWithUser, response: Response, next: NextFunction) {
  const authorizationHeader = request.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    response.status(401).json({ success: false, message: 'Missing authorization token' })
    return
  }

  const token = authorizationHeader.slice('Bearer '.length)

  try {
    request.user = jwt.verify(token, env.JWT_SECRET) as IUser
    next()
  } catch {
    response.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}