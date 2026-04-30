import { supabase } from './client';
import { BeamState } from '../types/structural';

export async function saveProject(userId: string, title: string, state: BeamState) {
  const { data, error } = await supabase
    .from('beam_projects')
    .insert([
      {
        user_id: userId,
        title,
        sign_convention: state.settings.clockwisePositive,
        structural_data: JSON.stringify(state),
      },
    ])
    .select();

  if (error) {
    console.error('Error saving project:', error);
    throw new Error(error.message);
  }
  return data;
}

export async function loadUserProjects(userId: string) {
  const { data, error } = await supabase
    .from('beam_projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error loading projects:', error);
    throw new Error(error.message);
  }
  return data;
}
