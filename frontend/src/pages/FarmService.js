import api from '../api/axios';

export const switchFarm = async (farmId) => {
  const response = await api.post(
    '/accounts/switch-farm/',

    {
      farm_id: farmId,
    }
  );

  localStorage.setItem('active_farm', farmId);

  return response.data;
};
