using UnityEngine;

namespace Roadbound.Core
{
    public interface IDamageable
    {
        float CurrentHealth { get; }
        float MaxHealth { get; }
        bool IsDead { get; }

        void TakeDamage(float damage, bool isHeadshot = false);
        void Heal(float amount);
    }
}
