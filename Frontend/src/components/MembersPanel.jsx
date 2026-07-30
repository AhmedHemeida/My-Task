import { useEffect, useState } from 'react';
import { Loader2, UserMinus, UserPlus } from 'lucide-react';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';

export default function MembersPanel({ project, onChange, onNotify }) {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get('/users')
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
  }, [isAdmin]);

  const memberIds = project.members.map((member) => member._id);
  const available = users.filter((user) => user._id !== project.owner._id && !memberIds.includes(user._id));

  async function addMember(event) {
    event.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    try {
      await api.post(`/projects/${project._id}/members`, { userId: selectedUser });
      setSelectedUser('');
      onNotify({ message: 'Member added', type: 'success' });
      await onChange();
    } catch (error) {
      onNotify({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(member) {
    try {
      await api.delete(`/projects/${project._id}/members/${member._id}`);
      onNotify({ message: `${member.name} removed from the project`, type: 'success' });
      await onChange();
    } catch (error) {
      onNotify({ message: getErrorMessage(error), type: 'error' });
    }
  }

  return (
    <section className="card">
      <h2 className="font-semibold">Members</h2>

      <ul className="mt-4 space-y-3">
        <li className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{project.owner.name}</p>
            <p className="truncate text-xs text-muted">{project.owner.email}</p>
          </div>
          <span className="badge bg-primary-soft text-primary">Owner</span>
        </li>

        {project.members.map((member) => (
          <li key={member._id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.name}</p>
              <p className="truncate text-xs text-muted">{member.email}</p>
            </div>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-ghost h-11 w-11 px-0 hover:text-danger"
                aria-label={`Remove ${member.name} from the project`}
                onClick={() => removeMember(member)}
              >
                <UserMinus className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}

        {project.members.length === 0 && <li className="text-sm text-muted">No members added yet.</li>}
      </ul>

      {isAdmin && (
        <form onSubmit={addMember} className="mt-5 border-t border-line pt-4">
          <label htmlFor="add-member" className="label">
            Add a member
          </label>
          <div className="flex gap-2">
            <select
              id="add-member"
              className="field"
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
            >
              <option value="">Select a user</option>
              {available.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary shrink-0" disabled={!selectedUser || saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus className="h-4 w-4" aria-hidden="true" />
              )}
              Add
            </button>
          </div>
          {available.length === 0 && users.length > 0 && (
            <p className="mt-2 text-sm text-muted">Everyone is already part of this project.</p>
          )}
        </form>
      )}
    </section>
  );
}
