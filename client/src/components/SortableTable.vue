<template>
    <table>
        <thead>
            <tr>
                <th>Department</th>
                <th>Employees</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(row, index) in rows" :key="`employee-${index}`">
                <td>{{ row.department }}</td>
                <td>{{ [...row.employees].sort().join(', ') }}</td>
            </tr>
        </tbody>
    </table>
</template>