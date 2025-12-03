import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Live Preview Component
 *
 * Renders a visual mock of the generated tool in real-time
 * as the user answers questions in the wizard.
 */
export default function LivePreview({
  template,
  answers
}: {
  template: any;
  answers: Record<string, any>;
}) {
  // Theme configuration based on user selection
  const theme = answers.theme || 'modern';
  const primaryColor =
    theme === 'modern'
      ? '#3B82F6'
      : theme === 'classic'
      ? '#1E40AF'
      : theme === 'minimal'
      ? '#6B7280'
      : '#059669';

  const companyName = answers.companyName || 'Your Company';
  const features = answers.features || [];
  const integrations = answers.integrations || [];

  return (
    <div className="mt-6 p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">👁️</span>
        <h4 className="font-semibold text-lg">Pré-visualização Ao Vivo</h4>
      </div>

      {/* Mock UI Preview */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b dark:border-gray-700">
          <div>
            <motion.h2
              className="text-xl font-bold"
              style={{ color: primaryColor }}
              key={companyName}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {companyName}
            </motion.h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {template?.name || 'Tool Preview'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg text-white font-medium shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            Primary Action
          </motion.button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {['Dashboard', 'Analytics', 'Reports'].map((item, idx) => (
            <motion.div
              key={item}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              whileHover={{
                y: -4,
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  {item}
                </h3>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {idx + 1}
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-full" />
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Preview */}
        {features.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              Recursos Selecionados:
            </p>
            <div className="flex flex-wrap gap-2">
              {features.map((feature: string, idx: number) => (
                <motion.span
                  key={feature}
                  className="px-3 py-1 rounded-full text-sm text-white font-medium"
                  style={{ backgroundColor: primaryColor }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  ✓ {feature}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Integrations Preview */}
        {integrations.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              Integrações Ativas:
            </p>
            <div className="flex flex-wrap gap-3">
              {integrations.map((integration: string) => (
                <motion.div
                  key={integration}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                  whileHover={{ scale: 1.05 }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {integration}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Data Table Preview */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Item
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[1, 2, 3].map((i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <td className="px-4 py-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="inline-block px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Active
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-16" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Config Summary */}
      <motion.div
        className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-semibold block mb-1">Indústria</span>
            <span className="text-gray-800 dark:text-gray-200">
              {answers.industry || '—'}
            </span>
          </div>
          <div>
            <span className="font-semibold block mb-1">Usuários</span>
            <span className="text-gray-800 dark:text-gray-200">
              {answers.users || '—'}
            </span>
          </div>
          <div>
            <span className="font-semibold block mb-1">Integrações</span>
            <span className="text-gray-800 dark:text-gray-200">
              {integrations.length}
            </span>
          </div>
          <div>
            <span className="font-semibold block mb-1">Deploy</span>
            <span className="text-gray-800 dark:text-gray-200">
              {answers.deployTarget || '—'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}