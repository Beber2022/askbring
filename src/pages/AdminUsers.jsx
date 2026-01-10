import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Shield,
  Ban,
  CheckCircle,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, userTypeFilter, users]);

  const loadUsers = async () => {
    try {
      const allUsers = await base44.entities.User.list('-created_date', 1000);
      setUsers(allUsers);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(u => u.user_type === userTypeFilter);
    }

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (user) => {
    try {
      await base44.entities.User.update(user.id, {
        is_active: !user.is_active
      });
      await loadUsers();
      toast({
        title: user.is_active ? "Utilisateur désactivé" : "Utilisateur activé"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Users className="w-8 h-8 text-emerald-600" />
          Gestion des utilisateurs
        </h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Total utilisateurs</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Clients</p>
              <p className="text-3xl font-bold text-blue-600">
                {users.filter(u => u.user_type === 'client').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Bringeurs</p>
              <p className="text-3xl font-bold text-emerald-600">
                {users.filter(u => u.user_type === 'intervenant').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  className="pl-10"
                />
              </div>
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                  <SelectItem value="intervenant">Bringeurs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Liste des utilisateurs ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {user.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{user.full_name}</h4>
                          <Badge variant={user.user_type === 'intervenant' ? 'default' : 'secondary'}>
                            {user.user_type === 'intervenant' ? 'Bringeur' : 'Client'}
                          </Badge>
                          {user.role === 'admin' && (
                            <Badge className="bg-purple-100 text-purple-700">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {!user.is_active && (
                            <Badge variant="destructive">Désactivé</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {user.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {moment(user.created_date).format('DD/MM/YYYY')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserStatus(user)}
                      >
                        {user.is_active ? (
                          <>
                            <Ban className="w-4 h-4 mr-1" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}