import { Request, Response, NextFunction } from 'express';
import * as departmentService from './department.service';

export const getDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const departments = await departmentService.getAllDepartments();
    res.json({
      success: true,
      data: departments
    });
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const department = await departmentService.createDepartment(req.body);
    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: department
    });
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const department = await departmentService.updateDepartment(id, req.body);
    res.json({
      success: true,
      message: 'Department updated successfully.',
      data: department
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await departmentService.deleteDepartment(id);
    res.json({
      success: true,
      message: 'Department deactivated successfully.'
    });
  } catch (err) {
    next(err);
  }
};
