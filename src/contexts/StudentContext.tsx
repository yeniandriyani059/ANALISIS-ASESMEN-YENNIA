import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student } from '../types';
import { api } from '../lib/api';

interface StudentContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  isLoading: boolean;
  refreshStudents: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType>({
  students: [],
  setStudents: () => {},
  isLoading: false,
  refreshStudents: async () => {},
});

export const useStudentsContext = () => useContext(StudentContext);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudents();
      if (data) setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

  return (
    <StudentContext.Provider value={{ students, setStudents, isLoading, refreshStudents }}>
      {children}
    </StudentContext.Provider>
  );
};
