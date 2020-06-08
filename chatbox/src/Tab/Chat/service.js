import axios from "axios"
import config from "config"
import { buildFormData } from "utils"

export const createRoom = payload => {
	return axios.post(config.apiUrl + "/api/v1/room", buildFormData(payload))
}

export const updateRoomInfo = payload => {
	return axios.put(config.apiUrl + "/api/v1/room", buildFormData(payload))
}

export const getRooms = userId => {
	const params = {
		userId: userId
	}
	return axios.get(config.apiUrl + "/api/v1/rooms", { params: params })
}