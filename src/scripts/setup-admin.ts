#!/usr/bin/env ts-node
/**
 * Script para crear el Admin semilla en Supabase Auth + Profile
 * Ejecutar: npx ts-node --project tsconfig.scripts.json src/scripts/setup-admin.ts
 * Requiere variables de entorno en .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - INITIAL_ADMIN_EMAIL
 * - INITIAL_ADMIN_PASSWORD
 * - INITIAL_ADMIN_DNI
 * - INITIAL_ADMIN_NAME
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
const adminDni = process.env.INITIAL_ADMIN_DNI;
const adminName = process.env.INITIAL_ADMIN_NAME;

if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword || !adminDni || !adminName) {
  console.error('❌ Faltan variables de entorno requeridas:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('  INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, INITIAL_ADMIN_DNI, INITIAL_ADMIN_NAME');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setupAdmin() {
  console.log('🚀 Iniciando configuración de Admin semilla...');
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`👤 Nombre: ${adminName}`);
  console.log(`🆔 DNI: ${adminDni}`);

  try {
    // 1. Crear usuario en Auth
    console.log('\n1️⃣ Creando usuario en Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        dni: adminDni,
        role: 'admin',
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️ Usuario ya existe en Auth, actualizando...');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === adminEmail);
        if (existingUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password: adminPassword,
            email_confirm: true,
            user_metadata: {
              full_name: adminName,
              dni: adminDni,
              role: 'admin',
            },
          });
          if (updateError) throw updateError;
          console.log('✅ Usuario actualizado en Auth');
        }
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Usuario creado en Auth:', authData.user?.id);
    }

    // 2. Obtener el user_id (ya sea creado o existente)
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const adminUser = users.find(u => u.email === adminEmail);
    
    if (!adminUser) {
      throw new Error('No se pudo encontrar/crear el usuario admin');
    }

    const adminUserId = adminUser.id;
    console.log(`🆔 User ID: ${adminUserId}`);

    // 3. Crear/actualizar perfil en tabla profiles
    console.log('\n2️⃣ Creando perfil en tabla profiles...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: adminUserId,
        company_id: '00000000-0000-0000-0000-000000000001',
        dni: adminDni,
        full_name: adminName,
        role: 'admin',
        branch_id: '00000000-0000-0000-0000-000000000001',
        status: 'active',
        require_password_change: true, // FORZAR cambio de clave en primer login
      }, {
        onConflict: 'id',
      });

    if (profileError) throw profileError;
    console.log('✅ Perfil creado/actualizado con require_password_change = true');

    // 4. Verificar sede principal existe
    console.log('\n3️⃣ Verificando sede principal...');
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, name')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (branchError || !branch) {
      console.log('⚠️ Sede principal no encontrada, creando...');
      const { error: createBranchError } = await supabase
        .from('branches')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          company_id: '00000000-0000-0000-0000-000000000001',
          name: 'Sede Principal',
          address: 'Av. Principal 123, Lima, Perú',
          lat: -12.0464,
          lng: -77.0428,
          radius_meters: 100,
          is_active: true,
        });
      if (createBranchError) throw createBranchError;
      console.log('✅ Sede principal creada');
    } else {
      console.log(`✅ Sede principal existe: ${branch.name}`);
    }

    console.log('\n🎉 ¡Configuración de Admin semilla completada!');
    console.log('\n📋 Credenciales de acceso:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Contraseña: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANTE: El admin DEBE cambiar su contraseña en el primer login.');
    console.log('   El sistema lo redirigirá automáticamente a /first-login');

  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error);
    process.exit(1);
  }
}

setupAdmin();