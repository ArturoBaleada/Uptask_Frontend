import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTaskById, updateStatus } from '@/api/TaskAPI';
import { toast } from 'react-toastify';
import { formatDate } from '@/utils/utils';
import { statusTranslations } from '@/locales/es';
import type { TaskStatus } from '@/types/index';
import NotesPanel from '../notes/NotesPanel';

export default function TaskModalDetails() {

    const params = useParams()
    const projectId = params.projectId!
    const navigate = useNavigate()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const taskId = queryParams.get('viewTask')!

    const [isOpen, setIsOpen] = useState(false);

    const show = taskId ? true : false

    const { data, isError, error } = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => getTaskById({ projectId, taskId }),
        enabled: !!taskId,
        retry: false
    })

    const queryClient = useQueryClient()
    const { mutate } = useMutation({
        mutationFn: updateStatus,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            queryClient.invalidateQueries({ queryKey: ['project', projectId] })
            queryClient.invalidateQueries({ queryKey: ['task', taskId] })
        }
    })

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const status = e.target.value as TaskStatus
        const data = { projectId, taskId, status }
        mutate(data)
    }

    if (isError) {
        setTimeout(() => {
            toast.error(error.message, { toastId: 'error' })
        }, 1000);
        return <Navigate to={`/projects/${projectId}`} />
    }

    if (data) return (
        <>
            <Transition appear show={show} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => navigate(location.pathname, { replace: true })}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all p-16">
                                    <p className='text-sm text-slate-400'>Agregada el: {formatDate(data.createdAt)}</p>
                                    <p className='text-sm text-slate-400'>Última actualización: {formatDate(data.updatedAt)}</p>
                                    <Dialog.Title
                                        as="h3"
                                        className="font-black text-4xl text-slate-600 my-5"
                                    >{data.name}
                                    </Dialog.Title>
                                    <p className='text-lg text-slate-500 mb-2'>Descripción: {data.description}</p>

                                    <p className='font-bold text-2xl text-slate-600 my-5'>Historial de Cambios</p>
                                    <div className="border border-slate-300 rounded-md p-4">
                                        <button
                                            onClick={() => setIsOpen(!isOpen)}
                                            className="w-full text-left font-medium text-slate-700 hover:text-slate-900 transition-colors"
                                        >
                                            {isOpen ? '▼ Ocultar actividad' : '▶ Ver actividad completada'}
                                        </button>

                                        <div
                                            className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                                                }`}
                                        >
                                            {data.completedBy.length > 0 ? (
                                                <ul className="list-decimal pl-6 mt-4 space-y-2 text-sm text-slate-600">
                                                    {data.completedBy.map((activityLog) => (
                                                        <li key={activityLog._id}>
                                                            <span className="font-bold text-slate-700">
                                                                {statusTranslations[activityLog.status]}
                                                            </span>{' '}
                                                            por: {activityLog.user.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="mt-4 text-slate-500 italic">No hay cambios aún</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className='my-5 space-y-3'>
                                        <label className='font-bold'>Estado Actual:</label>
                                        <select className='w-full p-3 bg-white border border-gray-300' defaultValue={data.status} onChange={handleChange}>
                                            {Object.entries(statusTranslations).map(([key, value]) => (
                                                <option value={key} key={key}>{value}</option>
                                            ))}
                                        </select>
                                    </div>

                                   <NotesPanel
                                   notes={data.notes}
                                   />           

                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}