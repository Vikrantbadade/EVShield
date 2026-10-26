import { Request, Response, NextFunction } from 'express';
import { attackService } from '../services/attack.service.js';
import { createSuccessResponse, createErrorResponse } from '../utils/apiResponse.js';

export const getAttacks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, severity, status, attackType, page, pageSize } = req.query;

    const result = await attackService.getAttacks({
      search: search ? String(search) : undefined,
      severity: severity ? String(severity) : undefined,
      status: status ? String(status) : undefined,
      attackType: attackType ? String(attackType) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      pageSize: pageSize ? parseInt(String(pageSize), 10) : 10,
    });

    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getAttackById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const attack = await attackService.getAttackById(id);

    if (!attack) {
      res.status(404).json(createErrorResponse('ATTACK_NOT_FOUND', `Attack incident ${id} not found.`));
      return;
    }

    res.status(200).json(createSuccessResponse(attack));
  } catch (error) {
    next(error);
  }
};

export const getCurrentAttack = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const attack = await attackService.getAttackById('current');
    res.status(200).json(createSuccessResponse(attack));
  } catch (error) {
    next(error);
  }
};

export const mitigateAttack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await attackService.mitigate(id);
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
};

