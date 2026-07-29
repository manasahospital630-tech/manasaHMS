import { CreateEncounterInput, UpdateVitalsInput, UpdateSoapInput } from './emr.schema';
export declare const createEncounter: (providerId: string, input: CreateEncounterInput) => Promise<any>;
export declare const getPatientEncounters: (patientId: string) => Promise<any[]>;
export declare const getEncounterById: (id: string) => Promise<any>;
export declare const updateEncounterVitals: (id: string, input: UpdateVitalsInput) => Promise<any>;
export declare const updateEncounterSOAP: (id: string, input: UpdateSoapInput) => Promise<any>;
export declare const getEncounterByIpAdmissionId: (ipAdmissionId: string) => Promise<any>;
//# sourceMappingURL=encounter.service.d.ts.map