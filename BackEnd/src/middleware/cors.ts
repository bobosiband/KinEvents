import type { NextFunction, Request, Response } from 'express'

const allowedMethods = 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS'
const allowedHeaders = 'Content-Type,Authorization,X-Requested-With,Accept,Origin'

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestOrigin = req.headers.origin

  res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', allowedMethods)
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders)
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  next()
}